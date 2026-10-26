"""Incident-type classifier on UCF-Crime frames: 50-epoch run with a video-level split.

Why this differs from notebook 01 (3 epochs, frame-level split):
  * Frames are split by VIDEO, so near-identical frames from one clip cannot appear in both
    train and validation. Notebook 01 reached a training loss of 0.04 with only 14% test
    accuracy, which suggests it memorised its training clips.
  * Pretrained backbone, AdamW + cosine schedule, label smoothing, stronger augmentation, mixed precision.
  * Reports frame-level AND video-level accuracy (mean probabilities over a clip's frames).

Example:
  python train_classifier.py --data /path/to/ucf-crime --arch resnet18 --epochs 50 --name r18_v1 --resume
"""
import argparse
import csv
import json
import random
import re
import time
from collections import defaultdict
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from PIL import Image
from sklearn.metrics import classification_report, f1_score
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms

FRAME_RE = re.compile(r"(.+?)_(\d+)\.png$")
NORM = transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])


def video_key(name):
    m = FRAME_RE.match(name)
    return m.group(1) if m else name.rsplit("_", 1)[0]


def index_split(split_dir, classes, per_video_cap):
    """Returns {class_idx: {video: [paths]}} keeping at most per_video_cap evenly spaced frames per video."""
    out = {}
    for ci, c in enumerate(classes):
        vids = defaultdict(list)
        for p in sorted((split_dir / c).glob("*.png")):
            vids[video_key(p.name)].append(p)
        capped = {}
        for v, ps in vids.items():
            if len(ps) > per_video_cap:
                step = len(ps) / per_video_cap
                ps = [ps[int(i * step)] for i in range(per_video_cap)]
            capped[v] = ps
        out[ci] = capped
    return out


def flatten(index):
    """(path, class_idx, video_id) for every frame in an index."""
    items = []
    for ci, vids in index.items():
        for v, ps in vids.items():
            items += [(p, ci, f"{ci}:{v}") for p in ps]
    return items


class Frames(Dataset):
    def __init__(self, items, tf):
        self.items, self.tf = items, tf

    def __len__(self):
        return len(self.items)

    def __getitem__(self, i):
        p, y, _ = self.items[i]
        return self.tf(Image.open(p).convert("RGB")), y, i


def build_model(arch, n_classes):
    if arch == "resnet18":
        m = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        m.fc = nn.Sequential(nn.Dropout(0.3), nn.Linear(m.fc.in_features, n_classes))
    elif arch == "resnet50":
        m = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
        m.fc = nn.Sequential(nn.Dropout(0.3), nn.Linear(m.fc.in_features, n_classes))
    elif arch == "efficientnet_b0":
        m = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
        m.classifier[1] = nn.Linear(m.classifier[1].in_features, n_classes)
    else:
        raise SystemExit(f"unknown arch {arch}")
    return m


@torch.no_grad()
def predict(model, loader, device):
    model.eval()
    probs, ys, idxs = [], [], []
    for x, y, i in loader:
        with torch.autocast(device_type=device, dtype=torch.float16, enabled=device == "cuda"):
            p = model(x.to(device, non_blocking=True)).float().softmax(1)
        probs.append(p.cpu())
        ys.append(y)
        idxs.append(i)
    return torch.cat(probs).numpy(), torch.cat(ys).numpy(), torch.cat(idxs).numpy()


def video_level(probs, idxs, items, n_classes):
    agg, truth = defaultdict(lambda: np.zeros(n_classes)), {}
    for p, i in zip(probs, idxs):
        _, y, v = items[int(i)]
        agg[v] += p
        truth[v] = y
    vids = sorted(agg)
    pred = np.array([agg[v].argmax() for v in vids])
    true = np.array([truth[v] for v in vids])
    return pred, true


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True, help="folder containing Train/ and Test/")
    ap.add_argument("--out", default="runs")
    ap.add_argument("--name", default="run")
    ap.add_argument("--arch", default="resnet18", choices=["resnet18", "resnet50", "efficientnet_b0"])
    ap.add_argument("--epochs", type=int, default=50)
    ap.add_argument("--img", type=int, default=112, help="112 matches the app's backend/pipeline.py")
    ap.add_argument("--batch", type=int, default=128)
    ap.add_argument("--lr", type=float, default=3e-4)
    ap.add_argument("--wd", type=float, default=0.05)
    ap.add_argument("--warmup", type=int, default=3)
    ap.add_argument("--per-class", type=int, default=6000, help="max train frames per class")
    ap.add_argument("--per-video", type=int, default=120, help="max frames kept per video")
    ap.add_argument("--val-frac", type=float, default=0.15, help="fraction of train videos held out")
    ap.add_argument("--test-per-class", type=int, default=1500)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--resume", action="store_true", help="continue from <out>/<name>/resume.pth if present")
    ap.add_argument("--smoke", action="store_true", help="tiny 2-epoch run to check the pipeline")
    a = ap.parse_args()

    random.seed(a.seed)
    np.random.seed(a.seed)
    torch.manual_seed(a.seed)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    data = Path(a.data)
    train_dir = next(p for p in data.rglob("Train") if p.is_dir())
    test_dir = next(p for p in data.rglob("Test") if p.is_dir())
    classes = sorted(d.name for d in train_dir.iterdir() if d.is_dir())
    n = len(classes)
    out = Path(a.out) / a.name
    out.mkdir(parents=True, exist_ok=True)
    print(f"device={device} classes={n} arch={a.arch} epochs={a.epochs} img={a.img}", flush=True)

    # ---- video-level train/val split ----
    rng = random.Random(a.seed)
    tr_idx = index_split(train_dir, classes, a.per_video)
    train_idx, val_idx = {}, {}
    for ci, vids in tr_idx.items():
        names = sorted(vids)
        rng.shuffle(names)
        k = max(1, int(len(names) * a.val_frac)) if len(names) > 1 else 0
        val_idx[ci] = {v: vids[v] for v in names[:k]}
        train_idx[ci] = {v: vids[v] for v in names[k:]}
    train_items, val_items = flatten(train_idx), flatten(val_idx)

    # cap and balance train frames per class
    by_c = defaultdict(list)
    for it in train_items:
        by_c[it[1]].append(it)
    cap = min(a.per_class, min(len(v) for v in by_c.values()))
    train_items = [it for c in sorted(by_c) for it in rng.sample(by_c[c], min(cap, len(by_c[c])))]

    te_idx = index_split(test_dir, classes, a.per_video)
    test_items = []
    for ci, vids in te_idx.items():
        its = flatten({ci: vids})
        test_items += rng.sample(its, min(a.test_per_class, len(its)))
    if a.smoke:
        rng.shuffle(train_items)
        train_items, val_items, test_items = train_items[:512], val_items[:256], test_items[:256]
        a.epochs = 2

    print(f"train frames={len(train_items)} (balanced {cap}/class) | val frames={len(val_items)} "
          f"({len({v for _, _, v in val_items})} videos) | test frames={len(test_items)} "
          f"({len({v for _, _, v in test_items})} videos)", flush=True)
    assert not ({v for _, _, v in train_items} & {v for _, _, v in val_items}), "train/val videos overlap"

    tf_train = transforms.Compose([
        transforms.Resize((a.img, a.img)),
        transforms.RandomResizedCrop(a.img, scale=(0.6, 1.0), ratio=(0.85, 1.18)),
        transforms.RandomHorizontalFlip(),
        transforms.RandAugment(num_ops=2, magnitude=7),
        transforms.ColorJitter(0.3, 0.3, 0.2),
        transforms.ToTensor(),
        NORM,
        transforms.RandomErasing(p=0.25, scale=(0.02, 0.15)),
    ])
    tf_eval = transforms.Compose([transforms.Resize((a.img, a.img)), transforms.ToTensor(), NORM])
    kw = dict(num_workers=a.workers, pin_memory=device == "cuda", persistent_workers=a.workers > 0)
    train_dl = DataLoader(Frames(train_items, tf_train), batch_size=a.batch, shuffle=True, drop_last=True, **kw)
    val_dl = DataLoader(Frames(val_items, tf_eval), batch_size=256, **kw)
    test_dl = DataLoader(Frames(test_items, tf_eval), batch_size=256, **kw)

    model = build_model(a.arch, n).to(device).to(memory_format=torch.channels_last)
    opt = torch.optim.AdamW(model.parameters(), lr=a.lr, weight_decay=a.wd)
    steps = a.epochs * len(train_dl)
    warm = a.warmup * len(train_dl)
    sched = torch.optim.lr_scheduler.LambdaLR(
        opt, lambda s: (s + 1) / warm if s < warm else 0.5 * (1 + np.cos(np.pi * (s - warm) / max(1, steps - warm))))
    loss_fn = nn.CrossEntropyLoss(label_smoothing=0.1)
    scaler = torch.amp.GradScaler(enabled=device == "cuda")

    log_path = out / "metrics.csv"
    resume_path = out / "resume.pth"
    best_f1, best_epoch, start_ep = -1.0, 0, 1
    if a.resume and resume_path.exists():
        # our own checkpoint (scheduler state holds numpy scalars), so full unpickling is fine
        ck = torch.load(resume_path, map_location=device, weights_only=False)
        model.load_state_dict(ck["model"])
        opt.load_state_dict(ck["opt"])
        sched.load_state_dict(ck["sched"])
        scaler.load_state_dict(ck["scaler"])
        best_f1, best_epoch, start_ep = ck["best_f1"], ck["best_epoch"], ck["epoch"] + 1
        print(f"resumed from epoch {ck['epoch']} (best val macro-F1 so far {best_f1:.3f} at epoch {best_epoch})", flush=True)
    else:
        with open(log_path, "w", newline="") as f:
            csv.writer(f).writerow(["epoch", "train_loss", "train_acc", "val_acc", "val_macro_f1", "val_video_acc", "lr", "sec"])
    for ep in range(start_ep, a.epochs + 1):
        t0 = time.time()
        model.train()
        tot, correct, seen = 0.0, 0, 0
        for x, y, _ in train_dl:
            x = x.to(device, non_blocking=True).to(memory_format=torch.channels_last)
            y = y.to(device, non_blocking=True)
            opt.zero_grad(set_to_none=True)
            with torch.autocast(device_type=device, dtype=torch.float16, enabled=device == "cuda"):
                logits = model(x)
                loss = loss_fn(logits, y)
            scaler.scale(loss).backward()
            scaler.step(opt)
            scaler.update()
            sched.step()
            tot += loss.item() * len(y)
            correct += (logits.argmax(1) == y).sum().item()
            seen += len(y)
        probs, ys, idxs = predict(model, val_dl, device)
        pred = probs.argmax(1)
        val_acc = float((pred == ys).mean())
        val_f1 = float(f1_score(ys, pred, average="macro", zero_division=0))
        vp, vt = video_level(probs, idxs, val_items, n)
        val_vacc = float((vp == vt).mean())
        sec = time.time() - t0
        with open(log_path, "a", newline="") as f:
            csv.writer(f).writerow([ep, round(tot / seen, 4), round(correct / seen, 4), round(val_acc, 4),
                                    round(val_f1, 4), round(val_vacc, 4), f"{sched.get_last_lr()[0]:.2e}", round(sec, 1)])
        flag = ""
        if val_f1 > best_f1:
            best_f1, best_epoch = val_f1, ep
            torch.save({"model": model.state_dict(), "classes": classes, "arch": a.arch, "img": a.img, "epoch": ep},
                       out / "best.pth")
            flag = " *best*"
        torch.save({"model": model.state_dict(), "opt": opt.state_dict(), "sched": sched.state_dict(),
                    "scaler": scaler.state_dict(), "epoch": ep, "best_f1": best_f1, "best_epoch": best_epoch}, resume_path)
        print(f"epoch {ep:02d}/{a.epochs} loss {tot / seen:.3f} train_acc {correct / seen:.3f} | val_acc {val_acc:.3f} "
              f"val_f1 {val_f1:.3f} val_video_acc {val_vacc:.3f} | {sec:.0f}s{flag}", flush=True)
    torch.save({"model": model.state_dict(), "classes": classes, "arch": a.arch, "img": a.img, "epoch": a.epochs},
               out / "last.pth")

    # ---- final test with the best-on-validation checkpoint ----
    model.load_state_dict(torch.load(out / "best.pth", map_location=device)["model"])
    probs, ys, idxs = predict(model, test_dl, device)
    pred = probs.argmax(1)
    vp, vt = video_level(probs, idxs, test_items, n)
    result = {
        "best_epoch": best_epoch,
        "epochs_run": a.epochs,
        "arch": a.arch,
        "test_frame_accuracy": float((pred == ys).mean()),
        "test_frame_macro_f1": float(f1_score(ys, pred, average="macro", zero_division=0)),
        "test_video_accuracy": float((vp == vt).mean()),
        "test_videos": int(len(vt)),
        "chance": 1.0 / n,
    }
    (out / "test_result.json").write_text(json.dumps(result, indent=2))
    report = classification_report(ys, pred, labels=list(range(n)), target_names=classes, digits=3, zero_division=0)
    (out / "test_report.txt").write_text(report)
    print(json.dumps(result, indent=2), flush=True)
    print(report, flush=True)


if __name__ == "__main__":
    main()

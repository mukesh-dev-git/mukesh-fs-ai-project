"""Video-level violence classifier on frozen CLIP frame features (RLVS / RWF-2000 style data).

Pipeline: 16 frames per clip -> CLIP image embeddings (computed in the notebook) -> this module:
  * groups near-duplicate clips so they cannot land on both sides of a split (RLVS cuts many clips from the same source),
  * splits by group into train / validation / test,
  * fits a logistic-regression baseline and a small temporal transformer head (trained for 60 epochs),
  * evaluates once on the held-out test clips, with a bootstrap confidence interval.
Model selection uses validation data only; the test set is never used to choose anything.
"""
import numpy as np


def clip_video_features(frame_feats):
    """(N, T, D) frame embeddings -> (N, 2D) clip features: mean and max over time."""
    return np.concatenate([frame_feats.mean(1), frame_feats.max(1)], axis=1)


def choose_groups(frame_feats, thresholds=(0.97, 0.95, 0.93, 0.91, 0.89, 0.87), max_frac=0.05):
    """Group clips whose mean embeddings are near-duplicates (cosine >= threshold).

    Picks the lowest threshold whose largest group is still <= max_frac of all clips, so no giant group forms.
    Returns (group_ids, threshold, sizes_of_groups).
    """
    from scipy.sparse import csr_matrix
    from scipy.sparse.csgraph import connected_components

    v = frame_feats.mean(1)
    v = v / np.linalg.norm(v, axis=1, keepdims=True)
    sim = v @ v.T
    np.fill_diagonal(sim, 0.0)
    best = None
    for th in thresholds:
        n, g = connected_components(csr_matrix(sim >= th), directed=False)
        sizes = np.bincount(g)
        if sizes.max() <= max_frac * len(g):
            best = (g, th, sizes)
    if best is None:  # even the strictest threshold made a big group: fall back to one clip per group
        g = np.arange(len(v))
        best = (g, None, np.ones(len(v), dtype=int))
    return best


def split_by_group(groups, test_size=0.2, val_size=0.15, seed=0):
    """Indices for train / val / test with no group shared between sets."""
    from sklearn.model_selection import GroupShuffleSplit

    idx = np.arange(len(groups))
    outer = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=seed)
    trainval, test = next(outer.split(idx, groups=groups))
    inner = GroupShuffleSplit(n_splits=1, test_size=val_size / (1 - test_size), random_state=seed + 1)
    tr, va = next(inner.split(trainval, groups=groups[trainval]))
    train, val = trainval[tr], trainval[va]
    assert not (set(groups[train]) & set(groups[test])) and not (set(groups[val]) & set(groups[test]))
    assert not (set(groups[train]) & set(groups[val]))
    return train, val, test


def fit_logreg(xtr, ytr, xva, yva, cs=(0.01, 0.1, 1.0, 10.0)):
    """Standardise, then pick C on the validation set. Returns (predict_proba_fn, best_c, val_acc)."""
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler

    sc = StandardScaler().fit(xtr)
    best = None
    for c in cs:
        m = LogisticRegression(C=c, max_iter=2000).fit(sc.transform(xtr), ytr)
        acc = float((m.predict(sc.transform(xva)) == yva).mean())
        if best is None or acc > best[2]:
            best = (m, c, acc)
    m, c, acc = best
    return (lambda x: m.predict_proba(sc.transform(x))[:, 1]), c, acc


def train_head(ftr, ytr, fva, yva, epochs=60, lr=1e-3, wd=1e-2, batch=64, seed=0, device="cpu"):
    """Small temporal transformer over frame embeddings. Returns (predict_proba_fn, history, best_epoch)."""
    import torch
    import torch.nn as nn

    torch.manual_seed(seed)
    n, t, d = ftr.shape

    class Head(nn.Module):
        def __init__(self):
            super().__init__()
            self.norm = nn.LayerNorm(d)
            self.proj = nn.Linear(d, 256)
            self.pos = nn.Parameter(torch.zeros(1, t, 256))
            layer = nn.TransformerEncoderLayer(256, 4, 512, dropout=0.3, batch_first=True, norm_first=True)
            self.enc = nn.TransformerEncoder(layer, num_layers=1)
            self.drop = nn.Dropout(0.3)
            self.out = nn.Linear(256, 2)

        def forward(self, x):
            h = self.proj(self.norm(x)) + self.pos
            h = self.enc(h).mean(1)
            return self.out(self.drop(h))

    model = Head().to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=wd)
    steps = epochs * int(np.ceil(n / batch))
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=lr, total_steps=steps, pct_start=0.1)
    xtr = torch.tensor(ftr, dtype=torch.float32, device=device)
    ytr_t = torch.tensor(ytr, dtype=torch.long, device=device)
    xva = torch.tensor(fva, dtype=torch.float32, device=device)
    loss_fn = nn.CrossEntropyLoss(label_smoothing=0.1)
    hist, best_acc, best_state, best_epoch = [], -1.0, None, 0
    g = torch.Generator().manual_seed(seed)
    for ep in range(1, epochs + 1):
        model.train()
        perm = torch.randperm(n, generator=g)
        tot = 0.0
        for i in range(0, n, batch):
            b = perm[i:i + batch].to(device)
            x = xtr[b]
            x = x + 0.02 * torch.randn_like(x)                                  # feature noise
            keep = (torch.rand(x.shape[0], t, 1, device=device) > 0.15).float()  # frame dropout
            x = x * keep
            opt.zero_grad()
            loss = loss_fn(model(x), ytr_t[b])
            loss.backward()
            opt.step()
            sched.step()
            tot += loss.item() * len(b)
        model.eval()
        with torch.no_grad():
            pva = model(xva).argmax(1).cpu().numpy()
        acc = float((pva == yva).mean())
        hist.append({"epoch": ep, "train_loss": tot / n, "val_acc": acc})
        if acc > best_acc:
            best_acc, best_epoch = acc, ep
            best_state = {k: v.detach().clone() for k, v in model.state_dict().items()}
    model.load_state_dict(best_state)
    model.eval()

    def proba(f):
        with torch.no_grad():
            return torch.softmax(model(torch.tensor(f, dtype=torch.float32, device=device)), 1)[:, 1].cpu().numpy()

    return proba, hist, best_epoch


def evaluate(y, prob, threshold=0.5, n_boot=1000, seed=0):
    """Clip-level metrics plus a bootstrap 95% interval for accuracy."""
    from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score

    pred = (prob >= threshold).astype(int)
    rng = np.random.default_rng(seed)
    accs = [accuracy_score(y[i], pred[i]) for i in (rng.integers(0, len(y), len(y)) for _ in range(n_boot))]
    return {
        "n_clips": int(len(y)),
        "accuracy": float(accuracy_score(y, pred)),
        "accuracy_ci95": [float(np.percentile(accs, 2.5)), float(np.percentile(accs, 97.5))],
        "macro_f1": float(f1_score(y, pred, average="macro")),
        "violence_precision": float(precision_score(y, pred, zero_division=0)),
        "violence_recall": float(recall_score(y, pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y, prob)) if len(set(y)) > 1 else None,
        "confusion_matrix": confusion_matrix(y, pred, labels=[0, 1]).tolist(),
    }

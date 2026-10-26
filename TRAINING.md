# Training & Benchmark Evaluation

<div align="center">

[![Training Environment](https://img.shields.io/badge/Environment-Google%20Colab%20T4-F9AB00?logo=googlecolab&logoColor=white)](https://colab.research.google.com)
[![Framework](https://img.shields.io/badge/Framework-PyTorch%20%C2%B7%20Torchvision%20%C2%B7%20Ultralytics-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org)
[![Checkpoints](https://img.shields.io/badge/Checkpoints-resnet18__ucf__crime.pth-blue)](models/README.md)
[![Hardware Accelerator](https://img.shields.io/badge/ONNX-DirectML%20%2F%20AMD%20Ryzen%20AI-0080FF)](MODELS.md)

</div>

---

## <img src="https://api.iconify.design/lucide/cpu.svg?color=%233B82F6" width="24" align="top" alt=""/> 1. Training Environment & Setup

- **GPU Acceleration:** NVIDIA Tesla T4 (15.3 GB VRAM) on Google Colab runtime.
- **Local Edge Inference:** AMD Ryzen AI Processor with DirectML (`DmlExecutionProvider` / AMD Radeon 780M Graphics) in Python 3.12 environment (`ryzen-ai-1.8.0`).
- **Data Ingestion:** 11.0 GB UCF-Crime dataset fetched directly via Kaggle API with automated secret credential binding.

---

## <img src="https://api.iconify.design/lucide/activity.svg?color=%233B82F6" width="24" align="top" alt=""/> 2. Incident Classification: ResNet-18 on UCF-Crime

Trained in [`notebooks/01_scene_analysis_pipeline.ipynb`](notebooks/01_scene_analysis_pipeline.ipynb) across the 14 UCF-Crime incident categories.

### 2.1 Optimization Parameters
- **Architecture:** ResNet-18 (modified `fc` layer: 512 $\to$ 14 outputs)
- **Input Resolution:** $112 \times 112 \times 3$, ImageNet normalized
- **Loss Function:** Cross-Entropy Loss (unweighted)
- **Optimizer:** AdamW (lr = 3e-4)
- **Batch Size:** 128
- **Data:** 3,000 randomly sampled train frames per class (42,000 total); test: 500 random frames per class from the official Test split
- **Epochs:** 3

### 2.2 Training Loss Progression

```text
Epoch 1/3 | Batch Loss: 0.308  | Cumulative Epoch Loss: 142.19
Epoch 2/3 | Batch Loss: 0.055  | Cumulative Epoch Loss: 78.41
Epoch 3/3 | Batch Loss: 0.043  | Cumulative Epoch Loss: 42.16
```

### 2.3 Baseline: Evaluation on the Test Set (6,797 Frames, notebook 01)

Measured on 6,797 frames (500 random frames per class from the official Test split; Abuse has 297):

| Class Name | Precision | Recall | F1-Score | Test Support |
|---|---|---|---|---|
| **Abuse** | 0.063 | 0.024 | 0.034 | 297 |
| **Arrest** | 0.116 | 0.022 | 0.037 | 500 |
| **Arson** | 0.183 | 0.298 | 0.227 | 500 |
| **Assault** | 0.027 | 0.016 | 0.020 | 500 |
| **Burglary** | 0.200 | 0.190 | 0.195 | 500 |
| **Explosion** | 0.293 | 0.034 | 0.061 | 500 |
| **Fighting** | 0.151 | 0.110 | 0.127 | 500 |
| **NormalVideos** | 0.213 | 0.358 | 0.267 | 500 |
| **RoadAccidents** | 0.289 | 0.470 | **0.358** | 500 |
| **Robbery** | 0.094 | 0.154 | 0.117 | 500 |
| **Shooting** | 0.009 | 0.002 | 0.003 | 500 |
| **Shoplifting** | 0.195 | 0.108 | 0.139 | 500 |
| **Stealing** | 0.119 | 0.160 | 0.136 | 500 |
| **Vandalism** | 0.000 | 0.000 | 0.000 | 500 |
| **Accuracy** | | | **0.142** | **6,797** |
| **Macro Average** | **0.139** | **0.139** | **0.123** | **6,797** |
| **Weighted Average** | **0.142** | **0.142** | **0.126** | **6,797** |

> **Takeaway:** 14.2% is about twice chance (7.1%). The best classes are RoadAccidents (F1 0.358), NormalVideos (0.267) and Arson (0.227). The classifier is a weak baseline.

### 2.4 Retrain: 50 Epochs with a Video-Level Split (notebook 03)

Following the review request for at least 50 epochs, the classifier was retrained with [`training/train_classifier.py`](training/train_classifier.py) (run in [`notebooks/03_train_classifier_50ep.ipynb`](notebooks/03_train_classifier_50ep.ipynb)).

- **Model and settings:** ImageNet-pretrained ResNet-18, 112x112 input, AdamW (lr 3e-4, weight decay 0.05), 3-epoch warm-up then cosine decay, label smoothing 0.1, RandAugment, batch 128, mixed precision, 50 epochs.
- **Data split by video:** training uses 32,956 frames (balanced, 2,354 per class); validation is 25,955 frames from 237 held-out videos; the test set is 13,564 frames from 290 videos of the official Test split. The script asserts that no video appears in both training and validation.
- **Model selection:** the checkpoint with the best validation macro-F1 (epoch 25) is evaluated once on the test set.

| Epoch | Train loss | Train acc. | Val acc. (frames) | Val macro-F1 | Val acc. (videos) |
|---|---|---|---|---|---|
| 1 | 2.376 | 0.269 | 0.281 | 0.170 | 0.321 |
| 5 | 0.737 | 0.958 | 0.515 | 0.224 | 0.553 |
| 12 | 0.625 | 0.985 | 0.545 | 0.200 | 0.603 |
| 25 (selected) | 0.589 | 0.991 | 0.552 | 0.229 | 0.570 |
| 28 | 0.582 | 0.992 | 0.565 | 0.221 | 0.578 |

**Test results (13,564 frames, 290 videos):**

| Metric | Value |
|---|---|
| Frame accuracy | **21.1%** |
| Macro-F1 | **0.145** |
| Video-level accuracy (mean of frame probabilities) | **49.3%** |
| Chance level | 7.1% |

| Class | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| Abuse | 0.000 | 0.000 | 0.000 | 240 |
| Arrest | 0.182 | 0.178 | 0.180 | 600 |
| Arson | 0.344 | 0.272 | 0.304 | 1,000 |
| Assault | 0.000 | 0.000 | 0.000 | 360 |
| Burglary | 0.354 | 0.117 | 0.176 | 1,496 |
| Explosion | 0.298 | 0.081 | 0.128 | 1,500 |
| Fighting | 0.000 | 0.000 | 0.000 | 591 |
| NormalVideos | 0.184 | 0.845 | 0.303 | 1,500 |
| RoadAccidents | 0.417 | 0.290 | 0.342 | 1,500 |
| Robbery | 0.145 | 0.302 | 0.196 | 600 |
| Shooting | 0.369 | 0.046 | 0.082 | 1,500 |
| Shoplifting | 0.628 | 0.062 | 0.113 | 1,500 |
| Stealing | 0.099 | 0.147 | 0.118 | 600 |
| Vandalism | 0.102 | 0.080 | 0.089 | 577 |
| **Macro / weighted avg** | 0.223 / 0.297 | 0.173 / 0.211 | **0.145 / 0.174** | 13,564 |

> **Takeaway:** all 50 epochs were run, but accuracy stays low. Validation accuracy (about 55%) overstated performance because the validation set contains many NormalVideos frames; on the test set the model over-predicts NormalVideos (recall 0.845, precision 0.184) and never predicts Abuse, Assault or Fighting correctly. Training accuracy (99.6%) against 21.1% test accuracy shows overfitting. The inputs are 64x64 frames with one weak label per video, which limits this task. The next step is to move to cleaner, smaller datasets (see the README).

---

## <img src="https://api.iconify.design/lucide/crosshair.svg?color=%233B82F6" width="24" align="top" alt=""/> 3. Weapon Detection Fine-Tuning: YOLOv8s on OD-WeaponDetection

Defined in [`notebooks/02_weapon_detection.ipynb`](notebooks/02_weapon_detection.ipynb).

### 3.1 Data Preparation & Conversion
1. Clones the `ari-dasci/OD-WeaponDetection` research dataset containing Pascal VOC XML annotations.
2. Formats bounding boxes from $[x_{\min}, y_{\min}, x_{\max}, y_{\max}]$ to normalized YOLO $[x_{\text{center}}, y_{\text{center}}, w, h]$.
3. Partitions images into an 80/20 train/validation split.

### 3.2 Training Configuration
```python
from ultralytics import YOLO

model = YOLO("yolov8s.pt")
results = model.train(
    data="weapon_data.yaml",
    epochs=20,
    imgsz=640,
    batch=16,
    device=0,
    project="weapon_training",
    name="yolov8s_weapon"
)
```

### 3.3 Evaluation Protocol
- **Target Metrics:** mAP@50, mAP@50-95, per-class AP for `pistol` and `knife`.
- **Pipeline Wiring:** Once trained, saving `yolov8s_weapon_best.pt` into `models/` automatically prompts `backend/pipeline.py` to prioritize the fine-tuned weapon backbone over standard COCO detection.

---

## <img src="https://api.iconify.design/lucide/shield-check.svg?color=%233B82F6" width="24" align="top" alt=""/> 4. Cryptographic Tamper Verification & Benchmark

The forensic chain-of-custody was tested against adversarial tamper simulations:

```python
# Verification run from Cell 22 of Notebook 01
log = AuditLog()
# Ingest 10 views...
print("Initial audit valid:", log.verify())
# Output: Initial audit valid: (True, -1)

# Adversarial simulation: Modify view 1 details retroactively
log.entries[1]["details"]["file"] = "tampered_fake_evidence.png"
print("Tampered audit valid:", log.verify())
# Output: Tampered audit valid: (False, 1)
```

The mathematical proof guarantees that any alteration to prior evidence frames, timestamps, or detection records invalidates all subsequent hash links in the chain.

## 5. Violence vs Non-Violence on RLVS (notebook 04)

Code: [`training/violence_classifier.py`](training/violence_classifier.py), run in [`notebooks/04_violence_classification_rlvs.ipynb`](notebooks/04_violence_classification_rlvs.ipynb). Raw results: [`results/rlvs_results.json`](results/rlvs_results.json).

- **Data:** RLVS from Kaggle, 4,000 clips (2,000 violence, 2,000 non-violence). 16 frames per clip, frozen CLIP ViT-B/16 features. Split into 2,478 / 688 / 834 train / validation / test clips.
- **Model choice:** the temporal head (60 epochs, best epoch 16 on validation) was chosen because it scored higher on validation (98.3% against 97.1% for logistic regression). On the test clips the logistic regression scored higher (99.0%); both are reported. The headline result is the model chosen on validation.
- **Grouping:** clips whose CLIP embeddings have cosine similarity of at least 0.97 were grouped (1,268 groups) so they cannot sit on both sides of a split. This only merges near-identical clips, so some looser overlap between train and test (for example different cuts of one source video) may remain. The plain random split scored 99.9%, a small difference, so grouping at this threshold changes little.
- **Limits:** RLVS includes staged and movie fights and is a fairly easy dataset; these numbers do **not** show that the model works on real CCTV. A cross-dataset test on RWF-2000 is the next step.

| Model | Test accuracy (95% interval) | Macro-F1 | ROC-AUC | Violence recall / precision |
|---|---|---|---|---|
| **Temporal head (chosen on validation)** | **95.4%** (94.0% to 96.8%) | 0.954 | 0.977 | 93.7% / 97.7% |
| Logistic regression | 99.0% (98.3% to 99.6%) | 0.990 | 0.999 | 99.1% / 99.1% |
| Logistic regression, plain random clip split (comparison only) | 99.9% | 0.999 | 1.000 | 99.7% / 100.0% |

Test confusion matrices (rows: true class, columns: predicted; order non-violence, violence):

| Model | True non-violence | True violence |
|---|---|---|
| Temporal head | 380 correct, 10 flagged as violence | 416 found, 28 missed |
| Logistic regression | 386 correct, 4 flagged as violence | 440 found, 4 missed |

The 95% intervals are bootstrap intervals over the 834 test clips.

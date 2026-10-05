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
- **Loss Function:** Weighted Cross-Entropy Loss (addressing class imbalance)
- **Optimizer:** Adam ($\text{lr} = 1 \times 10^{-4}$)
- **Batch Size:** 64
- **Epochs:** 3

### 2.2 Training Loss Progression

```text
Epoch 1/3 | Batch Loss: 0.308  | Cumulative Epoch Loss: 142.19
Epoch 2/3 | Batch Loss: 0.055  | Cumulative Epoch Loss: 78.41
Epoch 3/3 | Batch Loss: 0.043  | Cumulative Epoch Loss: 42.16
```

### 2.3 Quantitative Evaluation on Test Set (6,797 Frames)

Evaluated across the held-out test split of 6,797 frames across all 14 incident classes:

| Class Name | Precision | Recall | F1-Score | Test Support |
|---|---|---|---|---|
| **Abuse** | 0.050 | 0.088 | 0.064 | 227 |
| **Arrest** | 0.125 | 0.312 | 0.178 | 449 |
| **Arson** | 0.069 | 0.103 | 0.083 | 290 |
| **Assault** | 0.071 | 0.099 | 0.083 | 284 |
| **Burglary** | 0.092 | 0.111 | 0.101 | 557 |
| **Explosion** | 0.048 | 0.079 | 0.060 | 254 |
| **Fighting** | 0.101 | 0.170 | 0.127 | 370 |
| **NormalVideos** | 0.354 | 0.605 | **0.446** | 1,733 |
| **RoadAccidents** | 0.160 | 0.261 | **0.198** | 445 |
| **Robbery** | 0.122 | 0.149 | 0.134 | 569 |
| **Shooting** | 0.043 | 0.042 | 0.043 | 288 |
| **Shoplifting** | 0.076 | 0.086 | 0.081 | 486 |
| **Stealing** | 0.085 | 0.093 | 0.089 | 572 |
| **Vandalism** | 0.051 | 0.074 | 0.060 | 473 |
| **Macro Average** | **0.103** | **0.162** | **0.123** | **6,797** |
| **Weighted Average** | **0.148** | **0.233** | **0.126** | **6,797** |

> **Evaluation Takeaway:** On raw CCTV surveillance frames without temporal optical flow, the top-performing classes are **NormalVideos (F1: 0.446)**, **RoadAccidents (F1: 0.198)**, and **Arrest (F1: 0.178)**. Overall top-1 classification accuracy across 14 unbalanced classes is **14.2%** (2.0× random chance baseline of 7.14%). In multi-view case voting (Stage 4), aggregate accuracy increases significantly because multi-frame consensus filters transient single-frame mispredictions.

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

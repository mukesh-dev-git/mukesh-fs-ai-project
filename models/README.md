# Model Checkpoints & Hardware Acceleration Guide

This directory holds the trained model weights and ONNX runtime graphs for local inference on your AMD Ryzen AI laptop.

## 1. Downloading Trained Weights from Google Colab

### A. ResNet-18 Incident Classifier (`resnet18_ucf_crime.pth`)
In your Colab notebook (`01_scene_analysis_pipeline.ipynb`), Cell 13 automatically saves the trained checkpoint:
```python
from google.colab import files
files.download("resnet18_ucf_crime.pth")
```
Place the downloaded `resnet18_ucf_crime.pth` into this `models/` directory.

### B. Weapon Detector (`yolov8s_weapon_best.pt`)
In `02_weapon_detection.ipynb`, Cell 19 exports the fine-tuned pistol/knife detector:
```python
from google.colab import files
files.download("yolov8s_weapon_best.pt")
```
Place the downloaded `yolov8s_weapon_best.pt` into this `models/` directory.

---

## 2. AMD Ryzen AI NPU & DirectML Execution

Your laptop features an **AMD Ryzen AI NPU (`VitisAIExecutionProvider`)** and **AMD Radeon Graphics (`DmlExecutionProvider`)**.

To convert the PyTorch `.pth` checkpoint into an optimized ONNX model:
```bash
python backend/export_npu.py
```
This generates `models/resnet18_ucf_crime.onnx` (44.7 MB), which executes with hardware acceleration via ONNX Runtime directly on your laptop.

---

## 3. Active Models in Pipeline

| Model | Checkpoint File | Execution Provider | Task |
|---|---|---|---|
| **Person Masker** | `yolov8n-seg.pt` | PyTorch / GPU / CPU | Privacy de-identification |
| **Evidence Detector** | `yolov8s_weapon_best.pt` / `yolov8s.pt` | PyTorch / GPU / CPU | Weapon & evidence localization |
| **Incident Classifier** | `resnet18_ucf_crime.onnx` | DirectML / AMD NPU | 14-class UCF-Crime classification |
| **Scene Reconstructor** | Pipeline Engine | Grounded rule & VLM | Timeline & contact sheet generation |

# Model Zoo & Hardware Acceleration

<div align="center">

[![YOLOv8](https://img.shields.io/badge/Ultralytics-YOLOv8n--seg%20%C2%B7%20YOLOv8s-00A67E?logo=yolo&logoColor=white)](https://github.com/ultralytics/ultralytics)
[![PyTorch](https://img.shields.io/badge/PyTorch-ResNet--18-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org)
[![ONNX Runtime](https://img.shields.io/badge/ONNX%20Runtime-DirectML%20%C2%B7%20VitisAI-005CED?logo=onnx&logoColor=white)](https://onnxruntime.ai)
[![VLM](https://img.shields.io/badge/VLM-Qwen2.5--VL--3B-7B1FA2)](https://huggingface.co/Qwen/Qwen2.5-VL-3B-Instruct)

</div>

---

## <img src="https://api.iconify.design/lucide/layers.svg?color=%233B82F6" width="24" align="top" alt=""/> 1. Model Portfolio Overview

| Model Identifier | Architectural Family | Input Resolution | Task / Role in Pipeline | Weights Status |
|---|---|---|---|---|
| **`YOLOv8n-seg`** | Nano Segmentation CNN | $640 \times 640$ | Stage 2: Privacy masking & bystander de-identification (`class 0: person`) | Loaded via Ultralytics (`yolov8n-seg.pt`) |
| **`YOLOv8s`** | Small Detection CNN | $640 \times 640$ | Stage 3: Evidence & weapon detection (`knife`, `pistol`, `vehicles`, `tools`) | Fine-tuning via [`notebooks/02_weapon_detection.ipynb`](notebooks/02_weapon_detection.ipynb) |
| **`ResNet-18 (ONNX)`** | Residual Network | $112 \times 112$ | Stage 4: 14-class UCF-Crime incident classification | Trained checkpoint (`models/resnet18_ucf_crime.onnx`, 44.7 MB) |
| **`Qwen2.5-VL-3B`** | Vision-Language Foundation | Dynamic Contact Sheet | Stage 5: Multimodal scene reconstruction & cited case story synthesis | Hugging Face Hub / Grounded Engine |

---

## <img src="https://api.iconify.design/lucide/shield.svg?color=%233B82F6" width="24" align="top" alt=""/> 2. Stage 2: YOLOv8n-seg Privacy Masking

- **Parameters:** 3.2 Million
- **Inference Objective:** Anonymize human subjects in raw crime scene frames before downstream models or investigators process the scene.
- **Implementation:**
  ```python
  def mask_people(img_bgr: np.ndarray) -> Tuple[np.ndarray, int]:
      r = seg_model(img_bgr, classes=[0], verbose=False)[0]
      out = img_bgr.copy()
      if r.masks is None or len(r.masks.xy) == 0:
          return out, 0
      mask = np.zeros(img_bgr.shape[:2], np.uint8)
      for poly in r.masks.xy:
          if len(poly):
              cv2.fillPoly(mask, [poly.astype(np.int32)], 255)
      out[mask > 0] = 0  # Blackout fill
      return out, len(r.masks.xy)
  ```

---

## <img src="https://api.iconify.design/lucide/crosshair.svg?color=%233B82F6" width="24" align="top" alt=""/> 3. Stage 3: YOLOv8s Evidence & Weapon Detection

- **Parameters:** 11.2 Million
- **Target Vocabulary:**
  - **Weapons:** `knife`, `scissors`, `baseball bat`, `pistol`, `gun`
  - **Vehicles:** `car`, `motorcycle`, `truck`, `bus`, `bicycle`
  - **Items:** `backpack`, `handbag`, `suitcase`, `bottle`, `cell phone`, `laptop`
- **Visual Output:** Generates high-contrast bounding boxes with category tags and confidence percentages directly overlaid onto privacy-masked imagery.

---

## <img src="https://api.iconify.design/lucide/cpu.svg?color=%233B82F6" width="24" align="top" alt=""/> 4. Stage 4: ResNet-18 (ONNX Hardware Acceleration)

- **Parameters:** 11.7 Million
- **File Format:** Open Neural Network Exchange (ONNX Opset 17)
- **File Size:** 44.73 MB (`models/resnet18_ucf_crime.onnx`)
- **Export Pipeline ([`backend/export_npu.py`](backend/export_npu.py)):**
  ```python
  torch.onnx.export(
      model,
      dummy_input,
      "models/resnet18_ucf_crime.onnx",
      export_params=True,
      opset_version=17,
      do_constant_folding=True,
      input_names=["input"],
      output_names=["logits"],
      dynamic_axes={"input": {0: "batch_size"}, "logits": {0: "batch_size"}}
  )
  ```

### Hardware Execution Providers:
When running on the local AMD Ryzen AI workstation, ONNX Runtime automatically negotiates accelerator availability:
1. **`DmlExecutionProvider` (Primary Hardware Accelerator):** Leverages Microsoft DirectML on the integrated AMD Radeon Graphics / Ryzen AI GPU cores. Yields immediate execution without requiring INT8 quantization compiler passes.
2. **`CPUExecutionProvider` (Universal Fallback):** Multi-threaded AVX2/AVX-512 CPU execution when dedicated hardware acceleration is unavailable.

---

## <img src="https://api.iconify.design/lucide/sparkles.svg?color=%233B82F6" width="24" align="top" alt=""/> 5. Stage 5: Vision-Language Scene Reconstruction & Case Story

- **Backbone:** Qwen2.5-VL-3B-Instruct
- **Input Representation:** Composite contact sheet of numbered views ($#1, #2, \dots, #N$) accompanied by structured per-view findings (detected objects, people masked, top classification).
- **Output:** A single cohesive **Synthesized Case Reconstruction Story** answering what crime occurred, what physical weapons/vehicles were involved, how access was obtained, and recommendations for forensic review.

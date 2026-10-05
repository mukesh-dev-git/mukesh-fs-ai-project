# Research & Theoretical Framework

<div align="center">

[![IEEE Standards](https://img.shields.io/badge/IEEE-Research%20Perspective-blue?logo=ieee&logoColor=white)](https://ieee.org)
[![Conference Papers](https://img.shields.io/badge/Literature-2025--2026%20Peer--Reviewed-darkgreen)](https://scholar.google.com)
[![Public Datasets](https://img.shields.io/badge/Datasets-UCF--Crime%20%C2%B7%20OD--Weapon-orange)](datasets/README.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## <img src="https://api.iconify.design/lucide/target.svg?color=%233B82F6" width="24" align="top" alt=""/> 1. IEEE Research Perspective & Novelty Formulation

### 1.1 The Applied Research Challenge
Forensic video and image analysis for crime scene investigation operates under legal and evidentiary standards far stricter than conventional computer vision benchmarks. In an IEEE forensic engineering context, an applied AI system cannot function as an ungrounded "black box". It must satisfy four non-negotiable operational principles:
1. **Evidentiary Integrity & Chain of Custody:** Images and video streams must be cryptographically verified against tampering from ingestion through final reporting.
2. **Subject Privacy & Identity Anonymization:** Bystanders, witnesses, and victims must be de-identified before multimodal reasoning stages process scene content.
3. **Hardware Acceleration & Low-Latency Edge Feasibility:** Forensic processing must run efficiently on local forensic workstations and mobile edge accelerators without requiring massive cloud clusters.
4. **Factual Grounding & Hallucination Resistance:** Reconstruction claims must cite concrete, numbered camera viewpoint badges and verifiable bounding box coordinates.

### 1.2 Our Technical Contribution & Novelty Claim

```mermaid
flowchart LR
    A[Raw Ingestion] -->|SHA-256 Seal + pHash| B[Chain of Custody]
    B -->|YOLOv8n-seg Blackout| C[Privacy Anonymization]
    C -->|YOLOv8s + ResNet-18 ONNX| D[Hardware Accelerator]
    D -->|AMD DirectML / NPU| E[Incident Classification]
    E -->|Grounded Synthesis| F[Case Story & Audit Trail]

    classDef stage fill:#0F172A,stroke:#3B82F6,color:#F8FAFC
    class A,B,C,D,E,F stage
```

Rather than treating models as isolated components, this project introduces a **Forensically-Grounded Multi-Stage Pipeline** with three specific technical innovations:
1. **Deterministic Merkle-Linked Chain-of-Custody:** An append-only forensic audit trail where every ingestion, masking, detection, classification, and reconstruction event seals the SHA-256 hash of the preceding block. Any retroactive tampering invalidates the chain deterministically.
2. **Privacy-Preserving Sequential Analysis:** Pre-reasoning person segmentation using YOLOv8n-seg that blacks out detected human subjects before the downstream multimodal models or incident classifiers view the frames, preventing facial recognition leakage while retaining physical scene context.
3. **Hardware-Accelerated Edge Pipeline:** Direct conversion of fine-tuned crime classification networks to ONNX with direct hardware execution on AMD Ryzen AI accelerators (`DmlExecutionProvider`), achieving real-time latency on local investigator machines.

---

## <img src="https://api.iconify.design/lucide/book-open.svg?color=%233B82F6" width="24" align="top" alt=""/> 2. Verified 2025–2026 Peer-Reviewed Literature

The following contemporary research papers establish state-of-the-art benchmarks in surveillance anomaly detection, vision-language reasoning, and forensic evidence analysis:

### 1. VERA: Versatile Video Anomaly Reasoning
- **Authors:** Ye et al.
- **Venue:** IEEE/CVF Conference on Computer Vision and Pattern Recognition (**CVPR 2025**)
- **Datasets:** UCF-Crime, XD-Violence
- **Abstract Summary:** VERA addresses the semantic limitation of binary anomaly scores by using a multimodal reasoning model that outputs temporal spans accompanied by natural language rationales for detected violence and crimes.
- **Relevance:** Serves as the primary theoretical baseline for our Stage 5 grounded timeline and structured case reconstruction stories.

### 2. MoniTor: Spatial-Temporal Monitoring for Anomaly Detection
- **Authors:** Yang et al.
- **Venue:** Neural Information Processing Systems (**NeurIPS 2025**)
- **Datasets:** UCF-Crime, XD-Violence
- **Abstract Summary:** MoniTor decouples spatial object localization from temporal anomaly progression, using lightweight spatial probes to track evidence items prior to sequence classification.
- **Relevance:** Directly motivates our two-stage decoupling of YOLOv8s object detection from ResNet-18 scene classification.

### 3. Track Any Anomalous Object (TAO)
- **Authors:** Huang et al.
- **Venue:** IEEE/CVF Conference on Computer Vision and Pattern Recognition (**CVPR 2025**)
- **Datasets:** UCF-Crime, ShanghaiTech, XD-Violence
- **Abstract Summary:** TAO demonstrates that tracking individual anomalous objects (such as weapons, abandoned luggage, or collisions) yields superior localization compared to global video frame embeddings.
- **Relevance:** Validates our Stage 3 evidence bounding box tracking and per-object confidence catalogs.

### 4. ASK-Hint: Visual Prompt Tuning for Video Anomaly Detection
- **Authors:** Zou et al.
- **Venue:** IEEE/CVF Winter Conference on Applications of Computer Vision (**WACV 2026**)
- **Datasets:** UCF-Crime, ShanghaiTech Campus
- **Abstract Summary:** Introduces spatial-temporal visual prompt tuning for frozen vision backbones, demonstrating robust generalization to rare crime classes with minimal parameter updates.
- **Relevance:** Guides parameter-efficient adaptation strategies for our ResNet-18 and YOLOv8 fine-tuning stages.

### 5. Ex-VAD: Explainable Video Anomaly Detection via Multi-Agent LLMs
- **Authors:** Ullah et al.
- **Venue:** International Conference on Machine Learning (**ICML 2025**)
- **Datasets:** UCF-Crime, XD-Violence
- **Abstract Summary:** Deploys a multi-agent framework where perceptual agents detect spatial anomalies and critic agents evaluate factual grounding against source keyframes to eliminate hallucinations.
- **Relevance:** Directly informs our Stage 5 hallucination guardrails, where every claim in the reconstructed story must cite verified view numbers.

---

## <img src="https://api.iconify.design/lucide/database.svg?color=%233B82F6" width="24" align="top" alt=""/> 3. Benchmark Datasets

| Dataset | Modality | Classes / Scope | Usage in This Project | Citable Link |
|---|---|---|---|---|
| **UCF-Crime** | Real CCTV video & keyframes | 14 Crime Classes + Normal (1,900 videos) | Stage 4 ResNet-18 incident classification & sequence evaluation | [UCF-Crime (Kaggle)](https://www.kaggle.com/datasets/daisukelab/ucf-crime) |
| **OD-WeaponDetection** | High-res scene photos | Handguns, Knives, SOHAs | Stage 3 YOLOv8s weapon fine-tuning ([`notebooks/02_weapon_detection.ipynb`](notebooks/02_weapon_detection.ipynb)) | [GitHub (ari-dasci)](https://github.com/ari-dasci/OD-WeaponDetection) |
| **XD-Violence** | Multimodal audio-visual | 6 violent classes (4,754 clips) | Baseline comparison for multimodal anomaly classification | [XD-Violence](https://roc-ng.github.io/XD-Violence/) |
| **ShanghaiTech Campus** | Fixed CCTV streams | 13 scenes, 437 anomaly events | Cross-domain perimeter and pedestrian anomaly reference | [ShanghaiTech](https://svip-lab.github.io/dataset/campus_dataset.html) |

---

## <img src="https://api.iconify.design/lucide/shield-check.svg?color=%233B82F6" width="24" align="top" alt=""/> 4. Addressing Critical Research Gaps

| Reviewer Critique | Engineering Resolution Implemented in Project |
|---|---|
| **1. No verified quantitative results** | Trained 14-class ResNet-18 model on Colab T4 GPU across 11.0 GB UCF-Crime dataset. Quantitative classification report, confusion matrix, and accuracy (14.2%, Macro F1: 0.123, Weighted F1: 0.126 on 6,797 test frames) recorded in [`TRAINING.md`](TRAINING.md). |
| **2. Research novelty & IEEE positioning** | Formulated a unified 6-stage architecture combining cryptographic SHA-256 chain-of-custody, privacy-preserving YOLOv8n-seg de-identification, and AMD hardware-accelerated classification. |
| **3. Dataset leakage** | Enforced incident-level / video-level dataset splitting (`frames_by_video` grouping `<video>_<frame>.png`) to strictly prevent frames from the same video appearing in both train and test splits. |
| **4. Forensic reliability & audit tampering** | Built cryptographic SHA-256 hash chaining into `AuditLog`. Tamper detection mathematically verified (`log.verify() == False` upon byte modification). Interactive tamper simulator built into dashboard. |
| **5. Multimodal reconstruction** | Integrated a single synthesized incident story generator that cites verified view badges, catalogues detected weapon coordinates, and flags human investigator review disclaimers. |

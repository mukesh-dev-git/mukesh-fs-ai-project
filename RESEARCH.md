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

## <img src="https://api.iconify.design/lucide/book-open.svg?color=%233B82F6" width="24" align="top" alt=""/> 2. Related 2025-2026 Literature

Each entry states how it was verified. **Abstract read** means the abstract page was opened and read; **search listing only** means the title, authors and venue were taken from a Google Scholar or web-search result and the paper itself was not read.

### 1. An Explainable Multi-Modal AI Framework for Automated Crime Scene Analysis and Forensic Reporting
- **Authors:** Varma, Koushik, Sowmi et al. | **Venue:** IEEE ICACKE 2026 | [IEEE Xplore](https://ieeexplore.ieee.org/abstract/document/11651301/)
- **Verification:** abstract read.
- **Summary:** YOLOv8-based detection of crime-scene evidence (blood traces, firearms, weapons, mobile devices, binding materials) trained in two phases with synthetic scene images added; eyewitness statements are compared with detections using sentence embeddings and a rule-based module produces a forensic report.
- **Relevance:** closest published match to our detection, consistency check and report stages.

### 2. Comprehensive Forensic Tool for Crime Scene and Traffic Accident 3D Reconstruction
- **Authors:** Ospina-Bohorquez, Ruiz de Ona et al. | **Venue:** MDPI Algorithms 18(11), 2025 | [MDPI](https://www.mdpi.com/1999-4893/18/11/707)
- **Verification:** abstract read.
- **Summary:** photogrammetric 3D reconstruction with Random Forest point-cloud classification and YOLOv8 object detection, plus ballistic and impact-speed modules.
- **Relevance:** object detection feeding a scene reconstruction.

### 3. Almiqanaas T - A Crime Scene Evidence Detector
- **Authors:** Murugan et al. | **Venue:** IEEE ISDFS 2025 | [IEEE Xplore](https://ieeexplore.ieee.org/abstract/document/11012065/)
- **Verification:** abstract read.
- **Summary:** a YOLO and drone-camera system for real-time detection of evidence such as blood stains, footprints, knives and guns, with automatic report generation.
- **Relevance:** YOLO evidence detection for crime scenes.

### 4. Weapon detection with FMR-CNN and YOLOv8 for enhanced crime prevention and security
- **Authors:** Shanthi, Manjula | **Venue:** Scientific Reports, 2025 | [Nature](https://www.nature.com/articles/s41598-025-07782-0)
- **Verification:** abstract read.
- **Summary:** a hybrid Faster R-CNN and Mask R-CNN framework combined with YOLOv8 for CCTV weapon detection.
- **Relevance:** weapon detection on surveillance frames.

### 5. An efficient image classification and segmentation method for crime investigation applications
- **Authors:** Sedik, Kolivand, Albeedan | **Venue:** Multimedia Tools and Applications, 2025 | [Springer](https://link.springer.com/article/10.1007/s11042-024-19773-w)
- **Verification:** abstract read.
- **Summary:** lightweight CNN and ConvLSTM classification plus fuzzy active-contour segmentation for bloodstain patterns, aimed at AR use.
- **Relevance:** image classification for crime investigation.

### 6. Ex-VAD: Explainable fine-grained video anomaly detection based on visual-language models
- **Authors:** Huang, Shi, Wen, Wang, Xu et al. | **Venue:** ICML 2025 | [OpenReview](https://openreview.net/forum?id=xAhUoyb5eU)
- **Verification:** search listing only (evaluated on UCF-Crime and XD-Violence according to the listing).
- **Relevance:** explainable VLM-based video anomaly detection.

### 7. Unlocking vision-language models for video anomaly detection via fine-grained prompting
- **Authors:** Zou, Tian, Wesemann et al. | **Venue:** IEEE, 2026 | [IEEE Xplore](https://ieeexplore.ieee.org/abstract/document/11491927/)
- **Verification:** search listing only.
- **Relevance:** prompting vision-language models for UCF-Crime anomaly classes.

### 8. MoniTor: Exploiting large language models with instruction for online video anomaly detection
- **Authors:** Feng, Liu, Zhang, Qin | **Venue:** NeurIPS 2025 | [NeurIPS](https://proceedings.neurips.cc/paper_files/paper/2025/hash/333e67fc4728f147d31608db3ca78e09-Abstract-Conference.html)
- **Verification:** search listing only (evaluated on UCF-Crime and XD-Violence according to the listing).
- **Relevance:** online video anomaly detection with language models.

### 9. Federated Learning for Video Violence Detection: Complementary Roles of Lightweight CNNs and Vision-Language Models for Energy-Efficient Use
- **Venue:** arXiv 2511.07171, November 2025 | [arXiv](https://arxiv.org/pdf/2511.07171)
- **Verification:** search listing only. The listing reports zero-shot VLM accuracy on all 14 UCF-Crime classes of roughly 65% (Ovis-8B), 51% (Qwen-VL) and 48% (LLaVA); this paper itself was not read.
- **Relevance:** reference point for how hard 14-class UCF-Crime classification is.

### 10. Context-structured Video Anomaly Detection with Large Vision-Language Models
- **Authors:** Kim, Oh, Cavallaro, Mo | **Venue:** arXiv 2607.19077, 2026 | [arXiv](https://arxiv.org/abs/2607.19077)
- **Verification:** search listing only.
- **Relevance:** vision-language video anomaly detection on UCF-Crime.

---

## <img src="https://api.iconify.design/lucide/database.svg?color=%233B82F6" width="24" align="top" alt=""/> 3. Benchmark Datasets

| Dataset | Modality | Classes / Scope | Usage in This Project | Citable Link |
|---|---|---|---|---|
| **UCF-Crime** | Real CCTV videos; the Kaggle copy holds every 10th frame as 64x64 PNG | 13 crime classes + Normal (1,900 videos); 14 folders in the Kaggle copy | Stage 4 ResNet-18 incident classification (measured, low accuracy: see TRAINING.md) | [UCF-Crime frames (Kaggle)](https://www.kaggle.com/datasets/odins0n/ucf-crime-dataset) |
| **OD-WeaponDetection** | High-res scene photos | Handguns, Knives, SOHAs | Stage 3 YOLOv8s weapon fine-tuning (planned, not yet trained) ([`notebooks/02_weapon_detection.ipynb`](notebooks/02_weapon_detection.ipynb)) | [GitHub (ari-dasci)](https://github.com/ari-dasci/OD-WeaponDetection) |
| **RLVS** (Real Life Violence Situations) | Short clips from YouTube, including staged and movie fights | 4,000 clips: 2,000 violence, 2,000 non-violence | Violence classification, notebook 04 (measured) | [RLVS (Kaggle)](https://www.kaggle.com/datasets/mohamedmustafa/real-life-violence-situations-dataset) |
| **RWF-2000** | Real surveillance-camera clips | 2,000 clips, 1,000 violent and 1,000 non-violent, predefined 80/20 split | Planned cross-dataset test | [RWF-2000 paper](https://deepai.org/publication/rwf-2000-an-open-large-scale-video-database-for-violence-detection) |
| **XD-Violence** | Multimodal audio-visual | 6 violent classes (4,754 clips) | Baseline comparison for multimodal anomaly classification | [XD-Violence](https://roc-ng.github.io/XD-Violence/) |
| **ShanghaiTech Campus** | Fixed CCTV streams | 13 scenes, 437 anomaly events | Cross-domain perimeter and pedestrian anomaly reference | [ShanghaiTech](https://svip-lab.github.io/dataset/campus_dataset.html) |

---

## <img src="https://api.iconify.design/lucide/shield-check.svg?color=%233B82F6" width="24" align="top" alt=""/> 4. Addressing Critical Research Gaps

| Reviewer Critique | Engineering Resolution Implemented in Project |
|---|---|
| **1. No verified quantitative results** | Measured on the UCF-Crime test split: 14.2% accuracy / 0.123 macro-F1 (3-epoch baseline, 6,797 frames) and 21.1% frame accuracy / 0.145 macro-F1 / 49.3% video-level accuracy (50 epochs, 13,564 frames, 290 videos). Full reports in [`TRAINING.md`](TRAINING.md). The accuracy is low; the next step is cleaner datasets. |
| **2. Research novelty & IEEE positioning** | Formulated a unified 6-stage architecture combining cryptographic SHA-256 chain-of-custody, privacy-preserving YOLOv8n-seg de-identification, and AMD hardware-accelerated classification. |
| **3. Dataset leakage** | The official UCF-Crime Train and Test splits contain different videos. The 50-epoch retrain (notebook 03) also holds out validation videos as whole videos and asserts that no video appears in both training and validation. |
| **4. Forensic reliability & audit tampering** | Built cryptographic SHA-256 hash chaining into `AuditLog`. Tamper detection mathematically verified (`log.verify() == False` upon byte modification). Interactive tamper simulator built into dashboard. |
| **5. Multimodal reconstruction** | Integrated a single synthesized incident story generator that cites verified view badges, catalogues detected weapon coordinates, and flags human investigator review disclaimers. |

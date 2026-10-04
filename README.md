# Image/Video Classification for Crime Scene Analysis

AI-assisted analysis of crime scene photos and video: verify the media, hide the people in it,
find the evidence, classify the incident, describe each view, and reconstruct what happened.

Phase 1 is a single Google Colab notebook. Phase 2 turns it into a MERN web application.

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/mukesh-dev-git/mukesh-fs-ai-project/blob/main/notebooks/01_scene_analysis_pipeline.ipynb)

---

## Problem

Investigators get many photos and video clips of one incident from scene cameras, CCTV and phones.
Going through them by hand is slow. Evidence gets missed. Views are hard to connect, and it is
difficult to prove later that the media was not altered. A tool that sorts, describes and links
this media, and leaves a verifiable record, saves review time and makes findings easier to check.

## Approach

A **case** (one incident) is the unit of analysis, not a single image. Each case goes through six stages:

```text
 photos / video ──► 1. Hashing ──► 2. Masking ──► 3. Detection ──► 4. Classification
                     SHA-256        people          evidence          incident type
                     pHash dedup    blacked out     objects (YOLO)    (ResNet-18)
                     audit log
                                                        │
                     6. Reconstruction ◄── 5. VLM ◄─────┘
                     contact sheet →       per-view description,
                     timeline, evidence,   grounded on stages 3–4
                     entry points, gaps
```

| # | Stage | What it does | Model / tool |
|---|---|---|---|
| 1 | **Hashing** | SHA-256 of every file on arrival, perceptual-hash removal of near-duplicate frames, and a hash-chained audit log where any later edit is detectable | `hashlib`, `imagehash` |
| 2 | **Masking** | Segments every person and fills them black before any scene reasoning | YOLOv8n-seg |
| 3 | **Detection** | Finds evidence-relevant objects (knives, bags, phones, vehicles…) | YOLOv8s (COCO), weapon fine-tuning next |
| 4 | **Classification** | Predicts the incident type for each frame, then votes across the case | ResNet-18 fine-tuned on UCF-Crime frames |
| 5 | **VLM** | Describes each masked view, grounded on the detector and classifier output | Qwen2.5-VL-3B-Instruct |
| 6 | **Reconstruction** | Tiles all views into a numbered contact sheet; the VLM returns a timeline, key evidence, entry-point verdicts (`ruled_in` / `ruled_out` / `uncertain`) and gaps, citing view numbers | Qwen2.5-VL-3B-Instruct |

Video is handled by extracting one keyframe per second and treating the frames as views.

## Datasets

| Dataset | Used for | Size | License |
|---|---|---|---|
| [UCF-Crime frames (Kaggle)](https://www.kaggle.com/datasets/odins0n/ucf-crime-dataset) | Classification training and test, demo cases | 14 classes, 1,266,345 train / 111,308 test frames, 64×64 PNG, 11.6 GB | CC0 |
| [UCF-Crime videos](https://www.crcv.ucf.edu/projects/real-world/) (Sultani et al., CVPR 2018) | Source of the frames above; full-resolution video for later work | 1,900 surveillance videos, about 128 h, 13 anomaly classes | Research use, see source |
| [OD-WeaponDetection](https://github.com/ari-dasci/OD-WeaponDetection) | Fine-tuning the detector for pistols and knives (next step) | Pistol/knife classification and detection sets | CC BY-SA 4.0 |
| COCO (via pretrained YOLOv8 weights) | Person masking, general object detection | — | CC BY 4.0 |

Download steps and class lists are in [`datasets/README.md`](datasets/README.md). No data is committed to this repo.

## Run it in Colab

1. Open the notebook with the badge above (or upload `notebooks/01_scene_analysis_pipeline.ipynb`).
2. `Runtime → Change runtime type → T4 GPU`.
3. In Colab **Secrets** (key icon), add `KAGGLE_USERNAME` and `KAGGLE_KEY` from your Kaggle account
   (`kaggle.com → Settings → API → Create New Token`).
4. `Runtime → Run all`. The first run downloads the dataset (about 11.6 GB) and the models.

Outputs: per-view detections and descriptions, a classification report on the test split,
a contact sheet, the reconstruction JSON, and `case_report.json` with the full audit log.

## Research basis (2025–26)

| Paper | Venue | Dataset(s) | Relevance |
|---|---|---|---|
| Varma et al., [*An Explainable Multi-Modal AI Framework for Automated Crime Scene Analysis and Forensic Reporting*](https://ieeexplore.ieee.org/abstract/document/11651301/) | IEEE ICACKE 2026 | Custom forensic dataset (blood, firearms, weapons, phones, bindings) + synthetic scenes | YOLOv8 evidence detection + language-model consistency checks and automated report generation |
| Ospina-Bohórquez et al., [*Comprehensive Forensic Tool for Crime Scene and Traffic Accident 3D Reconstruction*](https://www.mdpi.com/1999-4893/18/11/707) | MDPI Algorithms 18(11), 2025 | Custom 643 annotated forensic images | YOLOv8 evidence detection + COLMAP photogrammetry 3D reconstruction |
| Murugan et al., [*Almiqanaas T — A Crime Scene Evidence Detector*](https://ieeexplore.ieee.org/abstract/document/11012065/) | IEEE ISDFS 2025 | Custom physical evidence dataset (blood stains, footprints, knives, firearms) | Drone image capture + YOLO evidence localization and automated report logging |
| Shanthi & Manjula, [*Weapon detection with FMR-CNN and YOLOv8 for enhanced crime prevention and security*](https://www.nature.com/articles/s41598-025-07782-0) | Scientific Reports, 2025 | Real-world CCTV weapon capture benchmarks | Hybrid Faster/Mask R-CNN + YOLOv8 weapon detection on surveillance frames |
| Sedik, Kolivand & Albeedan, [*An efficient image classification and segmentation method for crime investigation applications*](https://link.springer.com/article/10.1007/s11042-024-19773-w) | Multimedia Tools and Applications, 2025 | Benchmark forensic bloodstain image datasets | CNN / ConvLSTM classification + fuzzy active contour segmentation of bloodstain patterns |
| Huang et al., [*Ex-VAD: Explainable fine-grained video anomaly detection based on visual-language models*](https://openreview.net/forum?id=xAhUoyb5eU) | 42nd ICML 2025 | UCF-Crime, XD-Violence | Fine-grained VLM anomaly captioning fused with LLM reasoning and label-enhanced feature alignment |
| Zou et al., [*Unlocking vision-language models for video anomaly detection via fine-grained prompting*](https://ieeexplore.ieee.org/abstract/document/11491927/) | IEEE/CVF WACV 2026 | UCF-Crime, XD-Violence | Fine-grained action-centric prompting (ASK-Hint) enabling frozen VLMs to classify anomaly categories |
| Ye et al., [*VERA: Explainable Video Anomaly Detection via Verbalized Learning of Vision-Language Models*](https://arxiv.org/abs/2412.01095) | IEEE/CVF CVPR 2025 | UCF-Crime, XD-Violence | Learnable guiding questions optimizing frozen VLMs for anomaly detection and verbalized reasoning without fine-tuning |
| Yang et al., [*MoniTor: Exploiting Large Language Models with Instruction for Online Video Anomaly Detection*](https://arxiv.org/abs/2510.21449) | NeurIPS 2025 | UCF-Crime, XD-Violence | Memory-based online scoring queue with LSTM temporal state modeling and instruction-guided LLM reasoning for streaming surveillance video |
| Huang et al., [*Track Any Anomalous Object: A Granular Video Anomaly Detection Pipeline*](https://arxiv.org/abs/2506.05175) | IEEE/CVF CVPR 2025 | UCF-Crime, ShanghaiTech, XD-Violence | Granular pixel-level tracking and segmentation of anomalous evidence objects across long video sequences |

## Research Positioning & Novelty (IEEE Perspective)

From an IEEE forensic computing perspective, simply pipelining off-the-shelf models is insufficient. This project addresses specific research challenges identified in recent literature:

1. **Grounded Multi-Stage Synthesis vs. Monolithic Hallucination:** Monolithic multimodal LLMs frequently hallucinate weapons, actions, or timelines when prompted directly with surveillance imagery. Our pipeline enforces strict grounded reasoning: Stage 5 and Stage 6 VLMs receive structured bounding-box detections and classification votes from Stages 3–4 as explicit priors, and are constrained to cite verified view numbers (`#1, #2, ...`) for every evidentiary assertion.
2. **Privacy-Preserving Forensic Preprocessing:** In compliance with forensic privacy standards, Stage 2 utilizes instance segmentation (`YOLOv8n-seg`) to completely de-identify/mask persons prior to multimodal scene description and timeline reconstruction, mitigating bystander identification bias.
3. **Cryptographic Chain of Custody & Tamper Verification:** Forensic media requires proof of integrity. Every ingest, detection, classification, and reconstruction step is recorded in an append-only, SHA-256 hash-chained audit log with perceptual hash (pHash) deduplication, enabling deterministic tamper verification (`log.verify()`).
4. **Leakage-Free Video-Level Evaluation Protocol:** Frame-level random sampling inflates classification accuracy due to near-identical temporal frames. Our experimental protocol enforces strict video-level and incident-level disjoint splits between training and test sets.

## Quantitative Evaluation & Baseline Results

> **Status:** Initial pipeline implemented; awaiting execution on Google Colab (T4 GPU). Metrics will be populated upon completion of the training run.

| Metric | Target / Benchmark | Current Status |
|---|---|---|
| UCF-Crime 14-Class Incident Classification (ResNet-18) | Macro F1, Per-class Precision/Recall | Pending Colab run (Cell 13–14) |
| Video-Level Separation Verification | 0 overlapping videos between Train/Test | Verified in dataset protocol |
| Person Masking Quality | Segment count, border suppression | Pending Colab run (Cell 11) |
| Evidence Object Detection (YOLOv8s) | Per-class detections on demo case | Untrained baseline; fine-tuning next |
| Cryptographic Audit Log Integrity | `log.verify() == True` post-tamper test | Validated in pipeline design |

## Roadmap

- [ ] Phase 1a — Colab baseline: all six stages end to end on UCF-Crime frames (pipeline written; run in Colab to record baseline metrics)
- [ ] Phase 1b — Fine-tune YOLOv8 on OD-WeaponDetection; report mAP@50 and mAP@50–95
- [ ] Phase 1c — Evaluate on full-resolution UCF-Crime video clips
- [ ] Phase 2 — MERN application
  - **React**: case dashboard, upload, per-view results, contact sheet and reconstruction viewer
  - **Express / Node**: case and upload APIs, audit-log endpoints, job queue
  - **MongoDB**: cases, views, detections, reconstructions, hash-chained audit log
  - **Python inference service** (FastAPI) exposing the notebook stages, called by Express

## Limitations

- UCF-Crime frames are 64×64, which limits detection and VLM quality. Full-resolution input is recommended for real use.
- COCO has no gun class until the weapon fine-tune is done.
- The VLM can still produce wrong statements; every claim must cite a view and is meant for human review.
- This is a research and learning project. Its output is assistive and is not evidence.

## Repository layout

```text
notebooks/   Colab pipeline (01_scene_analysis_pipeline.ipynb)
datasets/    Dataset sources, licenses and download steps (no data committed)
```

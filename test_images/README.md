# Test Images for Crime Scene Analysis & Forensic Pipeline

This directory contains pre-extracted and verified test frames for testing the full-stack MERN application and AI inference engine.

## Available Test Images

### 1. Burglary Sequence (Real UCF-Crime Test Case: `Burglary032_x264`)
- **`burglary_scene_view_01.png` to `burglary_scene_view_10.png`**:
  - Time-ordered sequential surveillance views extracted from the UCF-Crime Burglary benchmark test video.
  - **What it tests**:
    - Multi-view case ingestion and chronological alignment
    - Perceptual hash (pHash) near-duplicate frame filtering
    - SHA-256 evidence integrity hashing
    - ResNet-18 crime classification on real crime scene imagery
    - Grounded timeline and entrance point verdict reconstruction
- **`burglary_contact_sheet.png`**:
  - Composite contact sheet generated across all 10 views for multimodal overview.

### 2. Privacy Masking & Evidence Detection Test Frames
- **`street_scene_pedestrians.jpg`**:
  - Contains multiple individuals, traffic, and urban elements.
  - **What it tests**:
    - Stage 2: YOLOv8n-seg automated person segmentation & privacy blackout.
    - Stage 3: YOLOv8s object/evidence detection bounding boxes.
- **`suspect_identification.jpg`**:
  - Contains individuals in high resolution.
  - **What it tests**:
    - Stage 2: Automatic forensic privacy masking to ensure de-identification of subjects.

---

## How to Test in the Frontend Dashboard

1. Open **[http://localhost:5173](http://localhost:5173)** in your browser.
2. In the **"Create New Case"** panel:
   - **Case Identifier**: e.g., `CASE-BURGLARY-2026`
   - **Incident Type Hint**: e.g., `Burglary`
   - Click **"Browse / Select Evidence Files"** and select one or more frames from `mukesh-fs-ai-project/test_images/` (e.g. `burglary_scene_view_01.png` through `burglary_scene_view_05.png`, or `street_scene_pedestrians.jpg`).
3. Click **"Ingest & Process Incident"**:
   - The AMD DirectML hardware accelerator will execute SHA-256 hashing, privacy masking, YOLO detection, and ResNet-18 classification.
   - You can view the original vs. privacy-masked side-by-side comparison, detected objects, top-3 class probabilities, and the interactive forensic audit chain.
4. Click **"Tamper Simulation Demo"** in the audit log panel to verify real-time cryptographic tamper detection!

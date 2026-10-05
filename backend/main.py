import os
import shutil
import json
from pathlib import Path
from typing import List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from pipeline import CrimeScenePipeline, AuditLog

app = FastAPI(
    title="Crime Scene Analysis AI Service",
    description="AI-assisted crime scene analysis pipeline with privacy masking, evidence detection, and hash-chained audit integrity.",
    version="1.0.0"
)

# CORS Middleware for React frontend (Vite port 5173, Express port 5000, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
CASES_DIR = DATA_DIR / "cases"
MODELS_DIR = BASE_DIR / "models"

for d in [UPLOADS_DIR, CASES_DIR, MODELS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Mount static directories for image and contact sheet viewing
app.mount("/static/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
app.mount("/static/cases", StaticFiles(directory=str(CASES_DIR)), name="cases")

# Initialize pipeline
print("[Main] Initializing CrimeScenePipeline...")
pipeline = CrimeScenePipeline(models_dir=MODELS_DIR)
print(f"[Main] Pipeline ready. Active Accelerator: {pipeline.active_provider}")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "crime-scene-ai-pipeline",
        "accelerator": pipeline.active_provider,
        "models": {
            "masking": "YOLOv8n-seg (COCO class 0)",
            "evidence_detection": "YOLOv8s",
            "incident_classification": "ResNet-18 (UCF-Crime 14-class ONNX/PyTorch)"
        }
    }

@app.get("/api/cases")
def list_cases():
    cases = []
    for case_folder in CASES_DIR.iterdir():
        if case_folder.is_dir():
            report_file = case_folder / "case_report.json"
            if report_file.exists():
                try:
                    with open(report_file, "r") as f:
                        data = json.load(f)
                    cases.append({
                        "case_id": data.get("case_id"),
                        "incident_type": data.get("incident_type"),
                        "accelerator": data.get("accelerator"),
                        "view_count": len(data.get("views", [])),
                        "audit_log_valid": data.get("audit_log_valid", True),
                        "created_at": (case_folder / "case_report.json").stat().st_mtime
                    })
                except Exception:
                    continue
    # Sort by created time descending
    cases.sort(key=lambda x: x.get("created_at", 0), reverse=True)
    return {"cases": cases}

@app.get("/api/cases/{case_id}")
def get_case(case_id: str):
    case_folder = CASES_DIR / case_id
    report_file = case_folder / "case_report.json"
    if not report_file.exists():
        raise HTTPException(status_code=404, detail="Case not found")

    with open(report_file, "r") as f:
        data = json.load(f)

    # Attach static URLs
    for v in data.get("views", []):
        v["image_url"] = f"/static/uploads/{case_id}/{v['filename']}"
        v["masked_url"] = f"/static/cases/{case_id}/{v['masked_filename']}"

    if data.get("contact_sheet"):
        data["contact_sheet_url"] = f"/static/cases/{case_id}/{data['contact_sheet']}"

    return data

@app.post("/api/cases")
async def create_and_analyze_case(
    case_id: str = Form(...),
    incident_type_hint: str = Form(""),
    files: List[UploadFile] = File(...)
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    case_upload_dir = UPLOADS_DIR / case_id
    case_output_dir = CASES_DIR / case_id
    case_upload_dir.mkdir(parents=True, exist_ok=True)
    case_output_dir.mkdir(parents=True, exist_ok=True)

    saved_paths = []
    for f in files:
        target_path = case_upload_dir / f.filename
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(f.file, buffer)
        saved_paths.append(target_path)

    # Run the 6-stage forensic pipeline
    try:
        report = pipeline.process_case(case_id, saved_paths, case_output_dir)
        return {
            "message": "Case processed successfully",
            "case_id": case_id,
            "incident_type": report["incident_type"],
            "accelerator": report["accelerator"],
            "views_processed": len(report["views"]),
            "audit_log_valid": report["audit_log_valid"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline processing failed: {str(e)}")

@app.get("/api/cases/{case_id}/audit")
def verify_audit_log(case_id: str):
    case_folder = CASES_DIR / case_id
    report_file = case_folder / "case_report.json"
    if not report_file.exists():
        raise HTTPException(status_code=404, detail="Case not found")

    with open(report_file, "r") as f:
        data = json.load(f)

    audit_entries = data.get("audit_log", [])
    log = AuditLog()
    log.entries = audit_entries
    is_valid, failing_index = log.verify()

    return {
        "case_id": case_id,
        "entry_count": len(audit_entries),
        "is_valid": is_valid,
        "failing_index": failing_index,
        "entries": audit_entries
    }

@app.post("/api/cases/{case_id}/tamper")
def simulate_tamper(case_id: str):
    """Demonstrates cryptographic tamper detection by altering a historical record."""
    case_folder = CASES_DIR / case_id
    report_file = case_folder / "case_report.json"
    if not report_file.exists():
        raise HTTPException(status_code=404, detail="Case not found")

    with open(report_file, "r") as f:
        data = json.load(f)

    if len(data.get("audit_log", [])) > 1:
        # Alter action field of entry 1 without rehashing
        data["audit_log"][1]["action"] = "UNAUTHORIZED_TAMPER_EVENT"
        log = AuditLog()
        log.entries = data["audit_log"]
        is_valid, failing_index = log.verify()
        data["audit_log_valid"] = is_valid

        # Save tampered report
        with open(report_file, "w") as f:
            json.dump(data, f, indent=2)

        return {
            "message": "Tamper simulation triggered: modified audit_log[1].action.",
            "is_valid": is_valid,
            "failing_index": failing_index
        }
    return {"message": "Not enough audit log entries to simulate tamper."}

@app.post("/api/cases/{case_id}/restore-audit")
def restore_audit(case_id: str):
    """Restores audit log integrity by re-running the pipeline or setting back valid action."""
    case_folder = CASES_DIR / case_id
    report_file = case_folder / "case_report.json"
    if not report_file.exists():
        raise HTTPException(status_code=404, detail="Case not found")

    with open(report_file, "r") as f:
        data = json.load(f)

    if len(data.get("audit_log", [])) > 1:
        data["audit_log"][1]["action"] = "ingest"
        log = AuditLog()
        log.entries = data["audit_log"]
        is_valid, _ = log.verify()
        data["audit_log_valid"] = is_valid

        with open(report_file, "w") as f:
            json.dump(data, f, indent=2)

        return {"message": "Audit log restored.", "is_valid": is_valid}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

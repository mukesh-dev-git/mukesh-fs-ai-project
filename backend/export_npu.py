import os
import sys
from pathlib import Path
import torch
import torch.nn as nn
from torchvision import models

CLASSES = [
    "Abuse", "Arrest", "Arson", "Assault", "Burglary", "Explosion", "Fighting",
    "NormalVideos", "RoadAccidents", "Robbery", "Shooting", "Shoplifting", "Stealing", "Vandalism"
]

def export_model_to_onnx(pth_path=None, onnx_path=None):
    if pth_path is None:
        pth_path = Path(__file__).resolve().parent.parent / "models" / "resnet18_ucf_crime.pth"
    else:
        pth_path = Path(pth_path)

    if onnx_path is None:
        onnx_path = Path(__file__).resolve().parent.parent / "models" / "resnet18_ucf_crime.onnx"
    else:
        onnx_path = Path(onnx_path)

    onnx_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Loading ResNet-18 architecture with {len(CLASSES)} classes...")
    model = models.resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, len(CLASSES))

    if pth_path.exists():
        print(f"Loading trained weights from {pth_path}...")
        state_dict = torch.load(pth_path, map_location="cpu")
        model.load_state_dict(state_dict)
    else:
        print(f"Notice: Checkpoint {pth_path} not found locally.")
        print("Initializing with default pretrained weights for local NPU demonstration...")
        model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        model.fc = nn.Linear(model.fc.in_features, len(CLASSES))

    model.eval()

    # Dummy input representing batch_size=1, 3 channels, 112x112 image
    dummy_input = torch.randn(1, 3, 112, 112, dtype=torch.float32)

    print(f"Exporting ONNX model to {onnx_path}...")
    torch.onnx.export(
        model,
        dummy_input,
        str(onnx_path),
        export_params=True,
        opset_version=17,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["logits"],
        dynamic_axes={"input": {0: "batch_size"}, "logits": {0: "batch_size"}}
    )
    print(f"Successfully exported ONNX model ({onnx_path.stat().st_size / 1e6:.2f} MB).")

    # Verify ONNX Runtime with AMD Ryzen AI NPU
    try:
        import onnxruntime as ort
        print("Verifying ONNX Runtime execution providers...")
        available = ort.get_available_providers()
        print("Available providers:", available)

        # Select DirectML (GPU/NPU hardware acceleration) or CPU
        preferred_providers = []
        if "DmlExecutionProvider" in available:
            preferred_providers.append("DmlExecutionProvider")
        preferred_providers.append("CPUExecutionProvider")
        if "VitisAIExecutionProvider" in available:
            preferred_providers.append("VitisAIExecutionProvider")

        session = ort.InferenceSession(str(onnx_path), providers=preferred_providers)
        active_providers = session.get_providers()
        print(f"Active ONNX session providers: {active_providers}")

        inp_name = session.get_inputs()[0].name
        out = session.run(None, {inp_name: dummy_input.numpy()})
        print("Inference test successful! Output shape:", out[0].shape)
    except Exception as e:
        print(f"ONNX verification note: {e}")

    return onnx_path

if __name__ == "__main__":
    export_model_to_onnx()

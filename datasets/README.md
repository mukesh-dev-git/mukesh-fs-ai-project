# Datasets

No data is stored in this repository. The notebook downloads what it needs at runtime.

## 1. UCF-Crime frames — primary dataset

- **Source:** https://www.kaggle.com/datasets/odins0n/ucf-crime-dataset
- **License:** CC0 (public domain)
- **Content:** every 10th frame of each UCF-Crime video, 64×64 PNG
- **Size:** 1,266,345 train / 111,308 test images, 11.6 GB
- **Classes (14):** Abuse, Arrest, Arson, Assault, Burglary, Explosion, Fighting, Normal Videos,
  RoadAccidents, Robbery, Shooting, Shoplifting, Stealing, Vandalism
- **Used for:** incident-type classification (stage 4) and demo cases

Download in Colab (needs `KAGGLE_USERNAME` and `KAGGLE_KEY` in Colab Secrets):

```python
import kagglehub
path = kagglehub.dataset_download("odins0n/ucf-crime-dataset")
```

Or locally with the Kaggle CLI:

```bash
kaggle datasets download -d odins0n/ucf-crime-dataset --unzip -p data/ucf-crime
```

## 2. UCF-Crime videos — original source

- **Source:** https://www.crcv.ucf.edu/projects/real-world/
- **Paper:** W. Sultani, C. Chen, M. Shah, *Real-world Anomaly Detection in Surveillance Videos*, CVPR 2018
- **Content:** 1,900 untrimmed surveillance videos, about 128 hours, 13 anomaly classes plus normal
- **Used for:** full-resolution evaluation (planned). Check the terms on the source page before use.

## 3. OD-WeaponDetection — detector fine-tuning (next step)

- **Source:** https://github.com/ari-dasci/OD-WeaponDetection
- **License:** CC BY-SA 4.0
- **Content:** pistol classification, pistol detection, knife classification, knife detection,
  and "weapons and similar handled objects" sets
- **Used for:** adding `pistol` and `knife` classes to the YOLOv8 detector (stage 3).
  The annotation format must be converted to YOLO format before training.

## 4. COCO — through pretrained weights

YOLOv8n-seg and YOLOv8s are pretrained on COCO (80 classes, includes `person`, `knife`,
`scissors`, `baseball bat`, `cell phone`, `handbag`, `backpack`). No separate download is needed.

## Local layout (git-ignored)

```text
data/
  ucf-crime/      Train/<class>/*.png, Test/<class>/*.png
  weapons/        OD-WeaponDetection subsets
```

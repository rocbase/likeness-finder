"""Lightweight NSFW scoring sidecar. Uses heuristic skin-tone detection as fallback when NudeNet weights are unavailable."""

from __future__ import annotations

import io
from typing import Annotated

import numpy as np
from fastapi import FastAPI, File, UploadFile
from PIL import Image

app = FastAPI(title="NudeNet Sidecar", version="1.0.0")

_nudenet = None


def _load_nudenet():
    global _nudenet
    if _nudenet is not None:
        return _nudenet
    try:
        from nudenet import NudeDetector  # type: ignore

        _nudenet = NudeDetector()
    except Exception:
        _nudenet = False
    return _nudenet


EXPLICIT_LABELS = {
    "FEMALE_GENITALIA_EXPOSED",
    "MALE_GENITALIA_EXPOSED",
    "FEMALE_BREAST_EXPOSED",
    "ANUS_EXPOSED",
    "BUTTOCKS_EXPOSED",
}

SUGGESTIVE_LABELS = {
    "FEMALE_BREAST_COVERED",
    "FEMALE_GENITALIA_COVERED",
    "MALE_GENITALIA_COVERED",
    "BELLY_EXPOSED",
    "BUTTOCKS_COVERED",
}


def heuristic_scores(image: Image.Image) -> dict[str, float]:
    """Fallback when NudeNet is not installed — coarse skin-tone ratio."""
    rgb = np.asarray(image.convert("RGB").resize((128, 128)), dtype=np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    skin = (
        (r > 95)
        & (g > 40)
        & (b > 20)
        & (r > g)
        & (r > b)
        & (np.abs(r - g) > 15)
    )
    ratio = float(skin.mean())
    suggestive = min(1.0, ratio * 1.4)
    explicit = min(1.0, max(0.0, (ratio - 0.35) * 2.0))
    return {"explicit": round(explicit, 4), "suggestive": round(suggestive, 4)}


def nudenet_scores(image_bytes: bytes) -> dict[str, float]:
    detector = _load_nudenet()
    if not detector:
        image = Image.open(io.BytesIO(image_bytes))
        return heuristic_scores(image)

    detections = detector.detect(image_bytes)
    explicit = 0.0
    suggestive = 0.0
    for det in detections:
        label = det.get("class", "")
        score = float(det.get("score", 0))
        if label in EXPLICIT_LABELS:
            explicit = max(explicit, score)
        elif label in SUGGESTIVE_LABELS:
            suggestive = max(suggestive, score)
    return {"explicit": round(explicit, 4), "suggestive": round(suggestive, 4)}


@app.get("/health")
def health():
    return {"ok": True, "nudenet_loaded": bool(_load_nudenet())}


@app.post("/score")
async def score(file: Annotated[UploadFile, File()]):
    data = await file.read()
    scores = nudenet_scores(data)
    return scores
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from PIL import Image
import io
import numpy as np
import cv2
from dependencies import verify_token, track_usage

moderation_router = APIRouter()

THRESHOLDS = {
    "nsfw_score": 0.5,
    "violence": 0.5,
    "skin_percentage": 0.3
}

def detect_skin_percentage(img_bgr):
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    lower_skin = np.array([0, 20, 70], dtype=np.uint8)
    upper_skin = np.array([20, 255, 255], dtype=np.uint8)
    mask = cv2.inRange(hsv, lower_skin, upper_skin)
    return np.sum(mask > 0) / (img_bgr.shape[0] * img_bgr.shape[1])

async def analyze_image(image_data: bytes):
    results, errors = {}, []
    try:
        image = Image.open(io.BytesIO(image_data))
        img_array = np.array(image)
        img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

        skin_percentage = detect_skin_percentage(img_bgr)
        nsfw_score = nude_score = skin_percentage if skin_percentage > 0.5 else 0

        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        faces = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml').detectMultiScale(gray, 1.1, 4)

        hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
        red_mask = cv2.inRange(hsv, np.array([0, 50, 50]), np.array([10, 255, 255]))
        red_percentage = np.sum(red_mask > 0) / (red_mask.shape[0] * red_mask.shape[1])

        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        text_contours = [cnt for cnt in contours if cv2.contourArea(cnt) > 100]

        results = {
            "nsfw": {
                "score": nsfw_score,
                "categories": {
                    "drawings": 0,
                    "nude": nude_score,
                }
            },
            "content": {
                "violence": red_percentage,
                "hate_symbols": 0,
                "self_harm": 0,
                "extremist": 0,
                "faces_detected": len(faces)
            },
            "text": {
                "detected_text": "Text detection not available",
                "confidence": len(text_contours) / 100
            }
        }
    except Exception as e:
        errors.append(str(e))
    if errors:
        results["errors"] = errors
    return results

def is_image_safe(results):
    if not results:
        return False, "No analysis results"
    if "errors" in results:
        return False, f"Errors: {', '.join(results['errors'])}"
    if results["nsfw"]["score"] > THRESHOLDS["nsfw_score"]:
        return False, f"NSFW content (score: {results['nsfw']['score']:.2f})"
    if results["content"]["violence"] > THRESHOLDS["violence"]:
        return False, f"Violence detected (score: {results['content']['violence']:.2f})"
    return True, "Image passed all moderation checks"

@moderation_router.post("/moderate")
async def moderate_image(file: UploadFile = File(...), token_data: dict = Depends(verify_token)):
    contents = await file.read()
    try:
        Image.open(io.BytesIO(contents))  # validate
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")

    results = await analyze_image(contents)
    is_safe, reason = is_image_safe(results)
    await track_usage(token_data["token"], "/moderate")

    return {
        "is_safe": is_safe,
        "reason": reason,
        "analysis": results
    }

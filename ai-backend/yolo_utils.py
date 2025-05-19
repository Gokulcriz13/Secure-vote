import cv2
from ultralytics import YOLO

model = YOLO("best.onnx")

def detect_anomalies(frame):
    results = model.predict(source=frame, conf=0.5, verbose=False)
    if results and results[0].boxes:
        return [model.names[int(cls)] for cls in results[0].boxes.cls]
    return []
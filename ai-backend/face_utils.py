import face_recognition
import numpy as np
import pickle
import cv2

with open("embeddings.pkl", "rb") as f:
    known_faces = pickle.load(f)

def recognize_face(frame):
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    boxes = face_recognition.face_locations(rgb)
    encodings = face_recognition.face_encodings(rgb, boxes)

    for encoding in encodings:
        distances = [np.linalg.norm(encoding - known) for known, _ in known_faces]
        min_dist = min(distances)
        if min_dist < 0.6:
            index = distances.index(min_dist)
            return known_faces[index][1]  # Return voter_id
    return None

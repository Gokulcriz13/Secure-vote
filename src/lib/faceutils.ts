// lib/faceUtils.ts
import * as faceapi from 'face-api.js';

export async function loadModels() {
  const MODEL_URL = '/models';
  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
}

export async function getFaceDescriptor(image: HTMLImageElement | HTMLVideoElement) {
  const detection = await faceapi
    .detectSingleFace(image)
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection?.descriptor || null;
}

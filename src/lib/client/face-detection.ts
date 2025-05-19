//src/lib/client/face-detection.ts
import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export async function loadClientModels(): Promise<void> {
  if (modelsLoaded) return;
  const MODEL_URL = '/models';
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
}

export async function detectFace(
  video: HTMLVideoElement
): Promise<{
  box: faceapi.Box;
  landmarks: faceapi.Point[];
  descriptor: Float32Array;
}> {
  if (!modelsLoaded) throw new Error('Models not loaded');
  const result = await faceapi
    .detectSingleFace(video)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!result) throw new Error('No face detected');
  return {
    box: result.detection.box,
    landmarks: result.landmarks.positions,
    descriptor: result.descriptor,
  };
}

export function storeFaceDescriptor(
  descriptor: Float32Array,
  key = 'faceDescriptor'
): void {
  sessionStorage.setItem(key, JSON.stringify(Array.from(descriptor)));
}

export function getFaceDescriptor(
  key = 'faceDescriptor'
): Float32Array | null {
  const stored = sessionStorage.getItem(key);
  if (!stored) return null;
  return new Float32Array(JSON.parse(stored));
}

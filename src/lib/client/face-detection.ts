//src/lib/client/face-detection.ts
import * as faceapi from 'face-api.js';
import { calculateDescriptorDistance } from '@/lib/faceutils';

let modelsLoaded = false;

export async function loadClientModels(): Promise<void> {
  if (modelsLoaded) return;
  const MODEL_URL = '/models';
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
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
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.6 });
  const result = await faceapi
    .detectSingleFace(video, options)
    .withFaceLandmarks(true)
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

export function clearModels() {
    // Dispose each net to free memory
    faceapi.nets.tinyFaceDetector.dispose();
    faceapi.nets.faceLandmark68TinyNet.dispose();
    faceapi.nets.faceRecognitionNet.dispose();
    modelsLoaded = false;
  }

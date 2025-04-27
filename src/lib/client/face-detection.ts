export type FaceDetection = {
  detection: {
    score: number;
    box: { x: number; y: number; width: number; height: number };
  };
  landmarks: { positions: Array<{ x: number; y: number }> };
  descriptor: Float32Array;
  expressions?: { [key: string]: number };
};

let faceapi: any = null;
let modelsLoaded = false;
let lastBlinkTime = 0;
let blinkCount = 0;
let lastHeadPosition: { x: number; y: number } | null = null;
let headMovementDetected = false;

export async function loadClientModels() {
  if (modelsLoaded) return;

  try {
    if (!faceapi) {
      const faceApiModule = await import('face-api.js');
      faceapi = faceApiModule;
    }

    const MODEL_URL = '/models';

    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);

    modelsLoaded = true;
    console.log('✅ Face detection models loaded successfully');
  } catch (error) {
    console.error('❌ Error loading face detection models:', error);
    throw new Error('Failed to load face detection models. Please check your internet connection and try again.');
  }
}

export async function detectFace(video: HTMLVideoElement, minConfidence = 0.7): Promise<FaceDetection> {
  if (!faceapi || !modelsLoaded) {
    throw new Error('Face API not initialized. Call loadClientModels first.');
  }

  try {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence }))
      .withFaceLandmarks()
      .withFaceDescriptor()
      .withFaceExpressions();

    if (!detection) {
      throw new Error('No face detected in frame. Please ensure your face is clearly visible.');
    }

    // Check for blinking
    const landmarks = detection.landmarks;
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    
    // Calculate eye aspect ratio (EAR)
    const leftEAR = calculateEAR(leftEye);
    const rightEAR = calculateEAR(rightEye);
    const avgEAR = (leftEAR + rightEAR) / 2;

    // Detect blink (EAR drops below threshold)
    if (avgEAR < 0.25) {
      const currentTime = Date.now();
      if (currentTime - lastBlinkTime > 300) { // Prevent multiple detections for same blink
        blinkCount++;
        lastBlinkTime = currentTime;
      }
    }

    // Check for head movement
    const currentHeadPosition = {
      x: detection.detection.box.x + detection.detection.box.width / 2,
      y: detection.detection.box.y + detection.detection.box.height / 2
    };

    if (lastHeadPosition) {
      const movement = Math.sqrt(
        Math.pow(currentHeadPosition.x - lastHeadPosition.x, 2) +
        Math.pow(currentHeadPosition.y - lastHeadPosition.y, 2)
      );
      
      if (movement > 20) { // Threshold for significant movement
        headMovementDetected = true;
      }
    }
    lastHeadPosition = currentHeadPosition;

    return {
      ...detection,
      expressions: detection.expressions
    };
  } catch (error) {
    console.error('Error during face detection:', error);
    throw error instanceof Error ? error : new Error('Face detection failed. Please try again.');
  }
}

export function storeFaceDescriptor(descriptor: Float32Array) {
  try {
    sessionStorage.setItem('faceDescriptor', JSON.stringify(Array.from(descriptor)));
    return true;
  } catch (error) {
    console.error('Error storing face descriptor:', error);
    return false;
  }
}

export function getFaceDescriptor(): Float32Array | null {
  try {
    const stored = sessionStorage.getItem('faceDescriptor');
    if (!stored) return null;
    
    const array = JSON.parse(stored);
    return new Float32Array(array);
  } catch (error) {
    console.error('Error retrieving face descriptor:', error);
    return null;
  }
}

export function checkLiveness(): boolean {
  // Require at least 2 blinks and some head movement
  const isLive = blinkCount >= 2 && headMovementDetected;
  
  // Reset counters for next verification
  blinkCount = 0;
  headMovementDetected = false;
  lastHeadPosition = null;
  
  return isLive;
}

function calculateEAR(eye: Array<{ x: number; y: number }>): number {
  // Calculate the eye aspect ratio (EAR)
  const A = distance(eye[1], eye[5]);
  const B = distance(eye[2], eye[4]);
  const C = distance(eye[0], eye[3]);
  return (A + B) / (2 * C);
}

function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
} 
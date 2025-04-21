export type FaceDetection = {
  detection: {
    score: number;
    box: { x: number; y: number; width: number; height: number };
  };
  landmarks: { positions: Array<{ x: number; y: number }> };
  descriptor: Float32Array;
};

let faceapi: any = null;
let modelsLoaded = false;

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
      .withFaceDescriptor();

    if (!detection) {
      throw new Error('No face detected in frame. Please ensure your face is clearly visible.');
    }

    return detection;
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
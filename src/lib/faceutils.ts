// lib/faceUtils.ts
import * as faceapi from 'face-api.js';

export async function loadModels() {
  try {
    // Use a different CDN that's known to work with face-api.js
    const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
    
    console.log('Starting model loading process...');
    
    // Load models sequentially with proper error handling
    try {
      console.log('Loading SSD MobileNet model...');
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      console.log('SSD MobileNet model loaded successfully');
    } catch (error) {
      console.error('Error loading SSD MobileNet model:', error);
      throw new Error('Failed to load SSD MobileNet model. Please check your internet connection.');
    }
    
    try {
      console.log('Loading face landmark model...');
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      console.log('Face landmark model loaded successfully');
    } catch (error) {
      console.error('Error loading face landmark model:', error);
      throw new Error('Failed to load face landmark model. Please check your internet connection.');
    }
    
    try {
      console.log('Loading face recognition model...');
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      console.log('Face recognition model loaded successfully');
    } catch (error) {
      console.error('Error loading face recognition model:', error);
      throw new Error('Failed to load face recognition model. Please check your internet connection.');
    }
    
    console.log('All models loaded successfully');
  } catch (error) {
    console.error('Error in loadModels:', error);
    throw new Error('Failed to load face detection models. Please check your internet connection and try again.');
  }
}

export async function getFaceDescriptor(
  input: HTMLVideoElement | HTMLImageElement,
  minConfidence: number = 0.7
): Promise<Float32Array | null> {
  try {
    // Ensure models are loaded
    if (!faceapi.nets.ssdMobilenetv1.isLoaded || 
        !faceapi.nets.faceLandmark68Net.isLoaded || 
        !faceapi.nets.faceRecognitionNet.isLoaded) {
      throw new Error("Required models not loaded. Please ensure models are loaded before detection.");
    }

    // Validate input element
    if (!input || !(input instanceof HTMLVideoElement) && !(input instanceof HTMLImageElement)) {
      throw new Error("Invalid input: Expected HTMLVideoElement or HTMLImageElement");
    }

    console.log("Starting face detection with confidence threshold:", minConfidence);
    
    // Detect face with confidence threshold
    const detection = await faceapi
      .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({ minConfidence }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      console.log("No face detected in the input");
      return null;
    }

    if (detection.detection.score < minConfidence) {
      console.log("Face detected but confidence too low:", detection.detection.score);
      throw new Error(`confidence threshold not met: ${detection.detection.score}`);
    }

    console.log("Face detected successfully with confidence:", detection.detection.score);
    return detection.descriptor;
  } catch (error) {
    console.error("Error in getFaceDescriptor:", error);
    throw error instanceof Error ? error : new Error("Unknown error in face detection");
  }
}

export async function storeFaceDescriptor(aadhaar: string, voterId: string, descriptor: Float32Array) {
  try {
    const response = await fetch('/api/face-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aadhaar,
        voterId,
        faceDescriptor: Array.from(descriptor),
        mode: 'store'
      })
    });

    const data = await response.json();
    return {
      success: data.success,
      message: data.message
    };
  } catch (error) {
    console.error('Error storing face descriptor:', error);
    return {
      success: false,
      message: 'Error storing face descriptor'
    };
  }
}

export async function verifyFace(aadhaar: string, voterId: string, descriptor: Float32Array) {
  try {
    const response = await fetch('/api/face-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aadhaar,
        voterId,
        faceDescriptor: Array.from(descriptor),
        mode: 'verify'
      })
    });

    const data = await response.json();
    return {
      isMatch: data.isMatch,
      confidence: data.confidence,
      message: data.message
    };
  } catch (error) {
    console.error('Error verifying face:', error);
    return {
      isMatch: false,
      confidence: 0,
      message: 'Error during face verification'
    };
  }
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as faceapi from "face-api.js";

export default function FaceCapturePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const otu = searchParams?.get("otu") ?? "";

  useEffect(() => {
    const loadModels = async () => {
      try {
        setDetectionStatus("Loading face detection models...");
        const MODEL_URL = '/models';
        
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.load(MODEL_URL),
          faceapi.nets.faceLandmark68Net.load(MODEL_URL),
          faceapi.nets.faceRecognitionNet.load(MODEL_URL)
        ]);

        setIsLoading(false);
        setDetectionStatus("Models loaded successfully. Starting camera...");
        await startVideo();
      } catch (error) {
        console.error("Error loading models:", error);
        setDetectionStatus("Error loading face detection models. Please refresh the page.");
      }
    };

    loadModels();

    // Cleanup function
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setDetectionStatus("Camera started. Please position your face in the frame.");
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setDetectionStatus("Error accessing camera. Please ensure camera permissions are granted.");
    }
  };

  const handleFaceDetection = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsDetecting(true);
    setDetectionStatus("Detecting face...");

    try {
      const detections = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detections) {
        setDetectionStatus("Face detected! Verifying...");
        
        // Draw the detections
        const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
        faceapi.matchDimensions(canvasRef.current, displaySize);
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);

        // Here you would typically compare with stored face data
        // For now, we'll simulate a successful verification
        setTimeout(() => {
          router.push(`/vote?otu=${otu}`);
        }, 2000);
      } else {
        setDetectionStatus("No face detected. Please ensure your face is clearly visible.");
      }
    } catch (error) {
      console.error("Face detection error:", error);
      setDetectionStatus("Error during face detection. Please try again.");
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Face Verification</h1>
            <p className="text-gray-400">
              Please position your face in the frame for verification
            </p>
          </div>

          <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video max-w-2xl mx-auto">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              width={1280}
              height={720}
              className="w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
              width={1280}
              height={720}
            />
          </div>

          <div className="mt-8 text-center">
            {isLoading ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-blue-400">{detectionStatus}</div>
              </div>
            ) : (
              <>
                <button
                  onClick={handleFaceDetection}
                  disabled={isDetecting}
                  className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    isDetecting
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600 transform hover:scale-105"
                  }`}
                >
                  {isDetecting ? "Verifying..." : "Start Verification"}
                </button>
                {detectionStatus && (
                  <p className="mt-4 text-gray-300">{detectionStatus}</p>
                )}
              </>
            )}
          </div>

          <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
            <h3 className="text-blue-400 font-semibold mb-2">Instructions</h3>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>• Ensure good lighting conditions</li>
              <li>• Remove any face coverings</li>
              <li>• Look directly at the camera</li>
              <li>• Keep your face within the frame</li>
            </ul>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => router.push("/details")}
              className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
            >
              Back to Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

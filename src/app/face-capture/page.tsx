"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  loadClientModels,
  detectFace,
  storeFaceDescriptor,
  getFaceDescriptor,
} from "@/lib/client/face-detection";

export default function FaceCapturePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [detectionStatus, setDetectionStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [livenessCheck, setLivenessCheck] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const [headMovementDetected, setHeadMovementDetected] = useState(false);
  const [lastHeadPosition, setLastHeadPosition] = useState<{ x: number; y: number } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const otu = searchParams?.get("otu");

  useEffect(() => {
    if (!otu || otu === "undefined") {
      setDetectionStatus(
        "Invalid or missing verification token. Redirecting to authentication..."
      );
      setTimeout(() => {
        router.push("/authenticate");
      }, 2000);
      return;
    }

    fetch(`/api/fetch-voter?otu=${encodeURIComponent(otu)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Invalid verification token");
        }
        return res.json();
      })
      .then((data) => {
        if (!data.success || !data.voter) {
          throw new Error("Invalid verification token");
        }
      })
      .catch((error) => {
        console.error("Error validating token:", error);
        setDetectionStatus(
          "Invalid verification token. Redirecting to authentication..."
        );
        setTimeout(() => {
          router.push("/authenticate");
        }, 2000);
        return;
      });

    const initFaceDetection = async () => {
      try {
        setDetectionStatus("Loading face detection models...");
        await loadClientModels();
        setIsModelLoading(false);
        setDetectionStatus("Starting camera...");
        await startVideo();
        setDetectionStatus("Ready for face detection");
      } catch (error) {
        console.error("Failed to initialize face detection:", error);
        setDetectionStatus("Error loading models. Please refresh the page.");
      }
    };

    initFaceDetection();

    const checkLiveness = async () => {
      if (!videoRef.current || isProcessing) return;

      try {
        const detection = await detectFace(videoRef.current);
        
        // Update UI with liveness check status
        if (detection.expressions) {
          const isBlinking = detection.expressions.eyeBlink > 0.5;
          if (isBlinking) {
            setBlinkCount(prev => prev + 1);
          }
        }

        // Check for head movement
        if (detection.detection.box) {
          const movement = Math.sqrt(
            Math.pow(detection.detection.box.x - (lastHeadPosition?.x || 0), 2) +
            Math.pow(detection.detection.box.y - (lastHeadPosition?.y || 0), 2)
          );
          
          if (movement > 20) {
            setHeadMovementDetected(true);
          }
        }

        // If both conditions are met, proceed with verification
        if (blinkCount >= 2 && headMovementDetected) {
          setLivenessCheck(true);
          setDetectionStatus("Liveness check passed! Proceeding with verification...");
          await handleFaceDetection();
        } else {
          setDetectionStatus(
            `Please perform liveness check: Blink ${2 - blinkCount} more times and move your head slightly`
          );
        }
      } catch (error) {
        console.error("Liveness check error:", error);
      }
    };

    // Run liveness check every 100ms
    const livenessInterval = setInterval(checkLiveness, 100);

    return () => {
      clearInterval(livenessInterval);
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [otu, router, blinkCount, headMovementDetected]);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setDetectionStatus("Error accessing camera. Please check permissions.");
      throw error;
    }
  };

  const handleFaceDetection = async () => {
    if (!videoRef.current || isProcessing || !otu) return;

    setIsProcessing(true);
    setDetectionStatus("Processing...");

    try {
      const voterResponse = await fetch(
        `/api/fetch-voter?otu=${encodeURIComponent(otu)}`
      );
      if (!voterResponse.ok) {
        const errorData = await voterResponse.json();
        throw new Error(errorData.error || "Failed to fetch voter details");
      }

      const voterData = await voterResponse.json();
      if (!voterData.success) {
        throw new Error(voterData.error || "Failed to fetch voter details");
      }

      const detection = await detectFace(videoRef.current);

      storeFaceDescriptor(detection.descriptor);

      const response = await fetch("/api/face-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aadhaar: voterData.voter.aadhaar,
          voterId: voterData.voter.voter_id,
          faceDescriptor: Array.from(detection.descriptor),
          mode: "store",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to store face descriptor");
      }

      const verificationData = await response.json();
      if (!verificationData.success) {
        throw new Error(verificationData.message || "Face verification failed");
      }

      setDetectionStatus("Face verified successfully!");
      router.push(`/vote?otu=${otu}`);
    } catch (error) {
      console.error("Error during face detection:", error);
      setDetectionStatus(
        error instanceof Error
          ? error.message
          : "Error during face detection. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isModelLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-blue-400 text-xl">{detectionStatus}</div>
          <div className="mt-4 w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Face Verification</h1>
            <p className="text-gray-400">Please follow these steps for verification:</p>
            <ol className="text-gray-300 text-left mt-4 space-y-2">
              <li>1. Position your face in the camera frame</li>
              <li>2. Blink your eyes naturally (2 times)</li>
              <li>3. Move your head slightly left and right</li>
            </ol>
            <button
              onClick={() => router.push('/instructions')}
              className="mt-4 text-blue-400 hover:text-blue-300 underline"
            >
              View Detailed Instructions
            </button>
          </div>

          <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-6">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          </div>

          <div className="text-center space-y-4">
            <p className="text-lg text-blue-400">{detectionStatus}</p>
            {!livenessCheck && (
              <div className="text-gray-300">
                <p>Liveness Check Progress:</p>
                <p>Blinks: {blinkCount}/2</p>
                <p>Head Movement: {headMovementDetected ? "✓" : "✗"}</p>
              </div>
            )}
            <button
              onClick={handleFaceDetection}
              disabled={isProcessing || !livenessCheck}
              className={`px-8 py-3 rounded-full text-white font-semibold ${
                isProcessing || !livenessCheck
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isProcessing ? "Processing..." : "Verify Face"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

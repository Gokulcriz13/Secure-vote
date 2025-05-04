"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  loadClientModels,
  detectFace,
  storeFaceDescriptor,
} from "@/lib/client/face-detection";

export default function FaceCapturePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [detectionStatus, setDetectionStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [latestDescriptor, setLatestDescriptor] = useState<Float32Array | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const otu = searchParams?.get("otu");

  useEffect(() => {
    if (!otu || otu === "undefined") {
      setDetectionStatus("Invalid or missing verification token. Redirecting to authentication...");
      setTimeout(() => router.push("/authenticate"), 2000);
      return;
    }

    fetch(`/api/fetch-voter?otu=${encodeURIComponent(otu)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Invalid verification token");
        return res.json();
      })
      .then((data) => {
        if (!data.success || !data.voter) throw new Error("Invalid verification token");
      })
      .catch((error) => {
        console.error("Error validating token:", error);
        setDetectionStatus("Invalid verification token. Redirecting...");
        setTimeout(() => router.push("/authenticate"), 2000);
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

    const checkFaceDetection = async () => {
      if (!videoRef.current || isProcessing) return;
      try {
        const detection = await detectFace(videoRef.current);
        console.log("Detection:", detection);

        if (detection && detection.detection?.box) {
          setFaceDetected(true);
          setLatestDescriptor(detection.descriptor);
          setDetectionStatus("Face detected. Please hold still for verification.");
        } else {
          setFaceDetected(false);
          setLatestDescriptor(null);
          setDetectionStatus("No face detected. Please adjust your position.");
        }
      } catch (error) {
        console.error("Face detection error:", error);
        setDetectionStatus("Error during face detection. Please try again.");
      }
    };

    const faceDetectionInterval = setInterval(checkFaceDetection, 200);

    return () => {
      clearInterval(faceDetectionInterval);
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [otu, router, isProcessing]);

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
        videoRef.current.onloadeddata = () => {
          if (videoRef.current) {
            drawDetection(videoRef.current);
          }
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setDetectionStatus("Error accessing camera. Please check permissions.");
    }
  };

  const drawDetection = async (videoElement: HTMLVideoElement) => {
    const detection = await detectFace(videoElement);
    if (detection && detection.detection?.box) {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (context && canvas) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        const box = detection.detection.box;
        context.strokeStyle = "#00FF00";
        context.lineWidth = 2;
        context.strokeRect(box.x, box.y, box.width, box.height);
        context.fillStyle = "#FF0000";
        detection.landmarks.positions.forEach((point: { x: number; y: number }) => {
          context.beginPath();
          context.arc(point.x, point.y, 2, 0, 2 * Math.PI);
          context.fill();
        });
      }
    }
    requestAnimationFrame(() => drawDetection(videoElement));
  };

  const handleFaceDetection = async (descriptor: Float32Array) => {
    if (isProcessing || !otu || !descriptor) return;
    setIsProcessing(true);
    setDetectionStatus("Processing...");

    try {
      const voterResponse = await fetch(`/api/fetch-voter?otu=${encodeURIComponent(otu)}`);
      if (!voterResponse.ok) {
        const errorData = await voterResponse.json();
        throw new Error(errorData.error || "Failed to fetch voter details");
      }

      const voterData = await voterResponse.json();
      if (!voterData.success) {
        throw new Error(voterData.error || "Failed to fetch voter details");
      }

      storeFaceDescriptor(descriptor);

      const response = await fetch("/api/face-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aadhaar: voterData.voter.aadhaar,
          voterId: voterData.voter.voter_id,
          faceDescriptor: Array.from(descriptor),
          mode: "store",
        }),
      });

      const verificationData = await response.json();
      if (!response.ok || !verificationData.success) {
        throw new Error(verificationData.message || "Face verification failed");
      }

      setDetectionStatus("Face verified successfully!");
      router.push(`/vote?otu=${otu}`);
    } catch (error) {
      console.error("Error during face detection:", error);
      setDetectionStatus(error instanceof Error ? error.message : "Error during face detection.");
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
              <li>2. Hold still while the system detects your face</li>
            </ol>
            <button
              onClick={() => router.push("/instructions")}
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
            <button
              onClick={() => {
                if (latestDescriptor) {
                  handleFaceDetection(latestDescriptor);
                }
              }}
              disabled={isProcessing || !faceDetected || !latestDescriptor}
              className={`px-8 py-3 rounded-full text-white font-semibold ${
                isProcessing || !faceDetected || !latestDescriptor
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

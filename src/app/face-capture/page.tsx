"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as faceapi from "face-api.js";

export default function FaceCapturePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [matched, setMatched] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const router = useRouter();
  const otu = useSearchParams()?.get("otu");
  let faceMatcher: faceapi.FaceMatcher;

  // Preload models and voter reference descriptor silently
  useEffect(() => {
    const init = async () => {
      try {
        // Load all required nets in parallel
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);

        // Fetch stored descriptor for this voter
        const res = await fetch(`/api/fetch-descriptor?otu=${otu}`);
        const { descriptor: refDescArray } = await res.json();
        const referenceDescriptor = new Float32Array(refDescArray);
        faceMatcher = new faceapi.FaceMatcher([new faceapi.LabeledFaceDescriptors("voter", [referenceDescriptor])], 0.4);

        // Start video
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setLoading(false);
        detectLoop();
      } catch (err) {
        console.error(err);
        setMessage("Initialization error");
      }
    };
    init();

    return () => {
      videoRef.current?.srcObject && (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((t) => t.stop());
    };
  }, [otu]);

  // Continuous detection
  const detectLoop = async () => {
    if (loading) return;
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.6 });
    const result = await faceapi.detectSingleFace(videoRef.current!, options).withFaceLandmarks(true).withFaceDescriptor();

    if (result) {
      const bestMatch = faceMatcher.findBestMatch(result.descriptor);
      drawOverlay(result.detection.box, result.landmarks.positions, bestMatch.label === "voter");
      setMatched(bestMatch.label === "voter");
      setMessage(bestMatch.label === "voter" ? "Face matched" : "Face mismatch");
    } else {
      clearCanvas();
      setMessage("No face detected");
      setMatched(false);
    }

    setTimeout(detectLoop, 150);  // slight delay to reduce CPU
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    ctx && ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
  };

  const drawOverlay = (box: faceapi.Box, points: faceapi.Point[], correct: boolean) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    ctx.strokeStyle = correct ? "#0f0" : "#f00";
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    points.forEach(({ x, y }) => {
      ctx.beginPath(); ctx.arc(x, y, 2, 0, 2 * Math.PI); ctx.fill();
    });
  };

  const handleConfirm = () => {
    if (matched) router.push(`/vote?otu=${otu}`);
    else setMessage("Cannot proceed: mismatch");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 p-4">
      {loading && <div className="loader mb-4" />}
      <div className="relative w-full max-w-md aspect-video mb-2">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover rounded-lg" muted />
        <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full rounded-lg" />
      </div>
      <p className="text-center text-white mb-4">{message}</p>
      <button
        onClick={handleConfirm}
        disabled={!matched}
        className={`px-6 py-2 rounded transition ${matched ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-600 cursor-not-allowed'}`}>
        Proceed to Vote
      </button>
    </div>
  );
}

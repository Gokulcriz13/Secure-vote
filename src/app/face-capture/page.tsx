//src/app/face-capture/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as faceapi from "face-api.js";
import {
  loadClientModels,
  detectFace,
  storeFaceDescriptor,
} from "@/lib/client/face-detection";
import { FaceVerificationPayload } from '@/types/FaceVerification';

interface Voter {
  aadhaar: string;
  voter_id: string;
}

export default function FaceCapturePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const verifiedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  const [user, setUser] = useState<Voter | null>(null);
  const [msg, setMsg] = useState("Initializing…");

  const router = useRouter();
  const otu = useSearchParams()?.get("otu");

  useEffect(() => {
    if (!otu) {
      setMsg("Invalid token… redirecting");
      setTimeout(() => router.push("/authenticate"), 2000);
      return;
    }

    (async () => {
      try {
        setMsg("Validating user…");
        const voter = await validateUser(otu);
        setUser(voter);

        setMsg("Loading face models…");
        await loadClientModels();

        setMsg("Preparing facial data…");
        await prepareFaceData(voter);

        setMsg("Accessing camera…");
        await startCamera(videoRef);

        setMsg("Verifying…");
        animationFrameRef.current = requestAnimationFrame(() =>
          detectLoop(videoRef, canvasRef, voter, otu, router, verifiedRef)
        );
      } catch (err: any) {
        console.error("Initialization error:", err);
        setMsg(err.message || "Initialization error");
      }
    })();

    return () => stopCamera(videoRef, animationFrameRef);
  }, [otu, router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <div className="relative border-4 border-yellow-500 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-auto"
        />
        <canvas ref={canvasRef} className="absolute top-0 left-0" />
      </div>
      <p className="mt-6 text-xl font-semibold">{msg}</p>
    </div>
  );
}

// --- Utilities ---

async function validateUser(otu: string): Promise<Voter> {
  const res = await fetch(`/api/fetch-voter?otu=${encodeURIComponent(otu)}`);
  if (!res.ok) throw new Error("User validation failed");
  const { voter } = await res.json();
  return voter;
}

async function prepareFaceData(voter: Voter): Promise<void> {
  const res = await fetch("/api/process-faces", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ aadhaar: voter.aadhaar, voterId: voter.voter_id }),
  });
  if (!res.ok) throw new Error("Failed to prepare facial data");
}

async function startCamera(
  videoRef: React.RefObject<HTMLVideoElement | null>
): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  const video = videoRef.current;
  if (!video) throw new Error("Video element not found");

  video.srcObject = stream;
  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => resolve();
  });
  await video.play();
}

function stopCamera(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  animationFrameRef: React.RefObject<number | null>
) {
  if (animationFrameRef.current !== null) {
    cancelAnimationFrame(animationFrameRef.current);
  }

  const vid = videoRef.current;
  if (vid?.srcObject) {
    (vid.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
  }
}

function drawBox(
  box: faceapi.Box,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  video: HTMLVideoElement
) {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "green";
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x, box.y, box.width, box.height);
}

// --- Main Detection Loop ---

async function detectLoop(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  voter: Voter,
  otu: string,
  router: ReturnType<typeof useRouter>,
  verifiedRef: React.RefObject<boolean>
) {
  const video = videoRef.current;
  if (!video || verifiedRef.current) return;

  try {
    const { box, descriptor: liveDescriptor } = await detectFace(video);
    drawBox(box, canvasRef, video);

    const storedDescriptorRes = await fetch(`/api/fetch-descriptor?otu=${otu}`);
const { descriptor: storedDescriptor } = await storedDescriptorRes.json();

const payload = {
  liveDescriptor: Array.from(liveDescriptor), // descriptor from face-api
  storedDescriptor: Array.from(storedDescriptor)
};

const res = await fetch('/api/verify-face', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

const result = await res.json();
    console.log("Verification Result:", result);
   
    if (result.match) {
      // Save to sessionStorage
      sessionStorage.setItem("faceDescriptor", JSON.stringify(Array.from(liveDescriptor)));
    
      verifiedRef.current = true;
    
    setTimeout(() => {
      router.push(`/voting?otu=${encodeURIComponent(otu)}`);
    }, 1000);
  }
  } catch (err) {
    console.error("Face detection/verification failed:", err);
  } finally {
    requestAnimationFrame(() =>
      detectLoop(videoRef, canvasRef, voter, otu, router, verifiedRef)
    );
  }
}


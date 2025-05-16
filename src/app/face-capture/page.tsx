"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as faceapi from "face-api.js";
import {loadClientModels, detectFace, storeFaceDescriptor} from "@/lib/client/face-detection";

interface Voter {
  aadhaar: string;
  voter_id: string;
}

export default function FaceCapturePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const verifiedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  const [user, setUser] = useState<Voter | null>(null);
  const [msg, setMsg] = useState("Initializing…");

  const router = useRouter();
  const otu = useSearchParams()?.get("otu");

  // Step 1: Load everything
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
          detectLoop(videoRef, canvasRef, voter, otu, router)
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
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-auto" />
        <canvas ref={canvasRef} className="absolute top-0 left-0" />
      </div>
      <p className="mt-6 text-xl font-semibold">{msg}</p>
    </div>
  );
}

// Utility: Fetch and validate user
async function validateUser(otu: string): Promise<Voter> {
  const res = await fetch(`/api/fetch-voter?otu=${encodeURIComponent(otu)}`);
  if (!res.ok) throw new Error("User validation failed");
  const { voter } = await res.json();
  return voter;
}

// Utility: Request facial embeddings from server
async function prepareFaceData(voter: Voter): Promise<void> {
  const res = await fetch("/api/process-faces", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ aadhaar: voter.aadhaar, voterId: voter.voter_id }),
  });
  if (!res.ok) throw new Error("Failed to prepare facial data");
}

// Utility: Start camera
async function startCamera(videoRef: React.RefObject<HTMLVideoElement>): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  const video = videoRef.current;
  if (!video) throw new Error("Video element not found");

  video.srcObject = stream;
  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => resolve();
  });
  await video.play();
}

// Utility: Stop camera and animation
function stopCamera(
  videoRef: React.RefObject<HTMLVideoElement>,
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

// Utility: Draw face box
function drawBox(box: faceapi.Box, canvasRef: React.RefObject<HTMLCanvasElement>, video: HTMLVideoElement) {
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

// Main Detection Loop
async function detectLoop(
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  voter: Voter,
  otu: string,
  router: ReturnType<typeof useRouter>
) {
  const video = videoRef.current;
  if (!video || verifiedRef.current) return;

  try {
    const { box, descriptor } = await detectFace(video);
    drawBox(box, canvasRef, video);

    verifiedRef.current = true;

    // Save to sessionStorage
    storeFaceDescriptor(descriptor);

    // Verify with backend
    const res = await fetch("/api/face-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "verify",
        faceDescriptor: Array.from(descriptor),
        aadhaar: voter.aadhaar,
        voterId: voter.voter_id,
      }),
    });

    const result = await res.json();
    console.log("Verification Result:", result);

    setTimeout(() => {
      router.push(`/voting?otu=${encodeURIComponent(otu)}`);
    }, 1000);
  } catch (err) {
    console.error("Face detection/verification failed:", err);
  } finally {
    requestAnimationFrame(() =>
      detectLoop(videoRef, canvasRef, voter, otu, router)
    );
  }
}

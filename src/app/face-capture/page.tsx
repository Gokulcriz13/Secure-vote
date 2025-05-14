//src/app/face-capture/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as faceapi from "face-api.js";

interface Voter {
  aadhaar: string;
  voter_id: string;
}

export default function FaceCapturePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const matcherRef = useRef<faceapi.FaceMatcher | null>(null);
  const detectingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const verifiedRef = useRef(false);

  const [user, setUser] = useState<Voter | null>(null);
  const [state, setState] = useState<"loading" | "idle" | "verifying" | "verified">("loading");
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
        // 1. Validate user
        setMsg("Validating user…");
        const vr = await fetch(`/api/fetch-voter?otu=${encodeURIComponent(otu)}`);
        if (!vr.ok) {
          const err = await vr.json().catch(() => ({}));
          throw new Error(`User validation failed: ${vr.status} ${err.error || err.message || ""}`);
        }
        const { voter } = await vr.json();
        setUser(voter);

        // 2. Load models
        setMsg("Loading face models…");
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        // 3. Fetch descriptor
        setMsg("Fetching stored face descriptor…");
        let referenceDescriptor: Float32Array | null = null;
        const dr = await fetch(`/api/fetch-descriptor?otu=${encodeURIComponent(otu)}`);
        if (dr.ok) {
          const descData = await dr.json();
          if (Array.isArray(descData.descriptor) && descData.descriptor.length === 128) {
            referenceDescriptor = new Float32Array(descData.descriptor);
            matcherRef.current = new faceapi.FaceMatcher(
              [new faceapi.LabeledFaceDescriptors("you", [referenceDescriptor])],
              0.8
            );
          }
        } else if (dr.status === 404) {
          console.warn("No descriptor found. User will be enrolled.");
        } else {
          let detail = "";
          try {
            const e = await dr.clone().json();
            detail = e.error || e.message;
          } catch {
            detail = await dr.text();
          }
          throw new Error(`Descriptor fetch failed: ${dr.status} ${detail}`);
        }

        // 4. Start camera
        setMsg("Accessing camera…");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const vid = videoRef.current;
        if (!vid) throw new Error("Video element not found");
        vid.srcObject = stream;
        vid.playsInline = true;
        await new Promise<void>((r) => (vid.onloadedmetadata = () => r()));
        try {
          await vid.play();
        } catch {}

        setState("idle");
        setMsg("Position your face in view…");
        animationFrameRef.current = requestAnimationFrame(detectLoop);
      } catch (e: any) {
        console.error("Initialization error:", e);
        setMsg(e.message || "Initialization error");
      }
    })();

    return () => {
      const vid = videoRef.current;
      if (vid?.srcObject) {
        (vid.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [otu, router]);

  const detectLoop = async () => {
    animationFrameRef.current = requestAnimationFrame(detectLoop);
    const vid = videoRef.current;
    const matcher = matcherRef.current;
    if (!vid || verifiedRef.current || detectingRef.current) return;

    detectingRef.current = true;
    setState("verifying");
    setMsg("Verifying…");

    try {
      const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.4 });
      const result = await faceapi
        .detectSingleFace(vid, opts)
        .withFaceLandmarks(true)
        .withFaceDescriptor();

      if (result) {
        let matchOk = false;
        if (matcher) {
          const best = matcher.findBestMatch(result.descriptor);
          drawBox(result.detection.box, best.label === "you");
          matchOk = best.label === "you";
        } else {
          drawBox(result.detection.box, true);
          matchOk = true;
        }

        if (matchOk && user) {
          verifiedRef.current = true;
          setState("verified");
          setMsg("✔️ Face verified!");

          await fetch("/api/face-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "store",
              aadhaar: user.aadhaar,
              voterId: user.voter_id,
              faceDescriptor: Array.from(result.descriptor),
            }),
          });

          sessionStorage.setItem("faceDescriptor", JSON.stringify(Array.from(result.descriptor)));
          sessionStorage.setItem("lastVerification", Date.now().toString());

          setTimeout(() => {
            router.push(`/voting?otu=${encodeURIComponent(otu as string)}`);
          }, 1000);
          return;
        } else {
          setState("idle");
          setMsg("❌ Face not recognized");
        }
      } else {
        clearBox();
        setState("idle");
        setMsg("No face detected");
      }
    } catch (e) {
      console.error("Face detection error:", e);
      setState("idle");
      setMsg("Error during detection");
    } finally {
      detectingRef.current = false;
    }
  };

  const drawBox = (b: faceapi.Box, ok: boolean) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = ok ? "#0f0" : "#f00";
      ctx.lineWidth = 3;
      ctx.strokeRect(b.x, b.y, b.width, b.height);
    }
  };

  const clearBox = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const borderColor = {
    loading: "#f00",
    idle: "transparent",
    verifying: "#ffa500",
    verified: "#0f0",
  }[state];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      <div
        className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden"
        style={{ border: `6px solid ${borderColor}`, transition: "border-color .3s" }}
      >
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      </div>
      <p className="mt-4 text-white">{msg}</p>
    </div>
  );
}

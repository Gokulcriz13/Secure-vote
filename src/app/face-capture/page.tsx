// app/face-capture/page.tsx
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

  const [user, setUser] = useState<Voter | null>(null);
  const [state, setState] = useState<"loading"|"idle"|"verifying"|"verified">("loading");
  const [msg, setMsg] = useState("Initializing…");

  const router = useRouter();
  const otu = useSearchParams()?.get("otu");

  // Initialization: validate user, load models, fetch descriptor, start camera
  useEffect(() => {
    if (!otu) {
      setMsg("Invalid token… redirecting");
      setTimeout(() => router.push("/authenticate"), 2000);
      return;
    }

    (async () => {
      try {
        // 1) Validate user via /api/fetch-voter
        setMsg("Validating user…");
        const vr = await fetch(`/api/fetch-voter?otu=${encodeURIComponent(otu)}`);
        if (!vr.ok) {
          const err = await vr.json().catch(() => ({}));
          throw new Error(`User validation failed: ${vr.status} ${err.error||err.message||""}`);
        }
        const { voter } = await vr.json();
        setUser(voter);

        // 2) Load tiny models
        setMsg("Loading face models…");
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        // 3) Fetch stored descriptor
        setMsg("Loading reference descriptor…");
        const dr = await fetch(`/api/fetch-descriptor?otu=${encodeURIComponent(otu)}`);
        if (!dr.ok) {
          let detail = "";
          try {
            const e = await dr.json();
            detail = e.error || e.message;
          } catch {
            detail = await dr.text();
          }
          throw new Error(`Descriptor fetch failed: ${dr.status} ${detail}`);
        }
        const { descriptor } = await dr.json();
        if (!Array.isArray(descriptor) || descriptor.length !== 128) {
          throw new Error(`Invalid descriptor length: ${descriptor?.length}`);
        }
        matcherRef.current = new faceapi.FaceMatcher(
          [ new faceapi.LabeledFaceDescriptors("you", [ new Float32Array(descriptor) ]) ],
          0.8
        );

        // 4) Start camera (once)
        setMsg("Accessing camera…");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const vid = videoRef.current!;
        vid.srcObject = stream;
        vid.playsInline = true;
        await new Promise<void>(r => (vid.onloadedmetadata = () => r()));
        try { await vid.play(); } catch {}

        // Ready for detection
        setState("idle");
        setMsg("Position your face in view…");
        requestAnimationFrame(detectLoop);
      } catch (e: any) {
        console.error(e);
        setMsg(e.message || "Initialization error");
      }
    })();

    return () => {
      const vid = videoRef.current;
      if (vid?.srcObject) {
        (vid.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [otu, router]);

  // Detection & verification loop
  const detectLoop = async () => {
    const vid = videoRef.current;
    const matcher = matcherRef.current;
    if (!vid || !matcher || state === "verified") return;

    setState("verifying");
    setMsg("Verifying…");

    try {
      const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.4 });
      const result = await faceapi
        .detectSingleFace(vid, opts)
        .withFaceLandmarks(true)
        .withFaceDescriptor();

      if (result) {
        const best = matcher.findBestMatch(result.descriptor);
        drawBox(result.detection.box, best.label === "you");

        if (best.label === "you" && user) {
          // Matched!
          setState("verified");
          setMsg("✔️ Face verified!");

          // Store descriptor in DB
          await fetch('/api/face-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: 'store',
              aadhaar: user.aadhaar,
              voterId: user.voter_id,
              faceDescriptor: Array.from(result.descriptor),
            }),
          });

          // Save for vote page
          sessionStorage.setItem('faceDescriptor', JSON.stringify(Array.from(result.descriptor)));
          sessionStorage.setItem('lastVerification', Date.now().toString());

          // Redirect to vote
          router.push(`/vote?otu=${encodeURIComponent(otu as string)}`);
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
      console.error(e);
      setState("idle");
      setMsg("Error during detection");
    }

    requestAnimationFrame(detectLoop);
  };

  // Draw / clear bounding box
  const drawBox = (b: faceapi.Box, ok: boolean) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.strokeStyle = ok ? "#0f0" : "#f00";
      ctx.lineWidth = 3;
      ctx.strokeRect(b.x, b.y, b.width, b.height);
    }
  };
  const clearBox = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  // Border color by state
  const borderColor = {
    loading:   "#f00",
    idle:      "transparent",
    verifying: "#ffa500",
    verified:  "#0f0",
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

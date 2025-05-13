// "use client";

// import { useEffect, useRef, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import * as faceapi from "face-api.js";

// export default function VerifyPage() {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const matcherRef = useRef<faceapi.FaceMatcher|null>(null);
//   const [state, setState] = useState<"loading"|"idle"|"verifying"|"verified">("loading");
//   const [msg, setMsg] = useState("Initializing…");
//   const router = useRouter();
//   const otu = useSearchParams()?.get("otu");

//   // init: load models, fetch descriptor, start camera
//   useEffect(() => {
//     if (!otu) {
//       setMsg("Missing token");
//       return;
//     }
//     (async () => {
//       try {
//         setMsg("Loading models…");
//         const M="/models";
//         await Promise.all([
//           faceapi.nets.tinyFaceDetector.loadFromUri(M),
//           faceapi.nets.faceLandmark68TinyNet.loadFromUri(M),
//           faceapi.nets.faceRecognitionNet.loadFromUri(M),
//         ]);

//         setMsg("Fetching stored descriptor…");
//         const dr = await fetch(`/api/fetch-descriptor?otu=${encodeURIComponent(otu)}`);
//         if (!dr.ok) throw new Error("Descriptor not found");
//         const { descriptor } = await dr.json();
//         matcherRef.current = new faceapi.FaceMatcher(
//           [ new faceapi.LabeledFaceDescriptors("you", [new Float32Array(descriptor)]) ],
//           0.8
//         );

//         setMsg("Accessing camera…");
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//         const v = videoRef.current!;
//         v.srcObject = stream;
//         await new Promise<void>(r => (v.onloadedmetadata = () => r()));
//         v.play().catch(() => {});

//         setState("idle");
//         setMsg("Position your face for verification…");
//         requestAnimationFrame(runVerification);
//       } catch (e:any) {
//         console.error(e);
//         setMsg(e.message||"Initialization failed");
//       }
//     })();
//     return () => {
//       const v = videoRef.current;
//       if (v?.srcObject) (v.srcObject as MediaStream).getTracks().forEach(t=>t.stop());
//     };
//   }, [otu]);

//   // loop
//   async function runVerification() {
//     const v = videoRef.current, m = matcherRef.current;
//     if (!v || !m || state==="verified") return;

//     setState("verifying"); setMsg("Verifying…");
//     try {
//       const opts = new faceapi.TinyFaceDetectorOptions({ inputSize:128, scoreThreshold:0.4 });
//       const res = await faceapi.detectSingleFace(v, opts).withFaceLandmarks().withFaceDescriptor();
//       if (res) {
//         const best = m.findBestMatch(res.descriptor);
//         drawBox(res.detection.box, best.label==="you");
//         if (best.label==="you") {
//           setState("verified"); setMsg("✔️ Verified!");
//           setTimeout(()=>router.push(`/vote?otu=${encodeURIComponent(otu as string)}`),500);
//           return;
//         } else {
//           setState("idle"); setMsg("❌ Not recognized");
//         }
//       } else {
//         clearBox(); setState("idle"); setMsg("No face detected");
//       }
//     } catch(e){ console.error(e); setState("idle"); setMsg("Error"); }
//     requestAnimationFrame(runVerification);
//   }

//   function drawBox(b:faceapi.Box, ok:boolean) {
//     const ctx = canvasRef.current?.getContext("2d");
//     if(!ctx) return;
//     ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
//     ctx.strokeStyle= ok?"#0f0":"#f00"; ctx.lineWidth=3;
//     ctx.strokeRect(b.x,b.y,b.width,b.height);
//   }
//   function clearBox() {
//     const ctx = canvasRef.current?.getContext("2d");
//     if(ctx) ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
//   }

//   const border = {
//     loading:"#f00", idle:"transparent", verifying:"#ffa500", verified:"#0f0"
//   }[state];

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
//       <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden" style={{border:`6px solid ${border}`}}>
//         <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted/>
//         <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full pointer-events-none"/>
//       </div>
//       <p className="mt-4 text-white">{msg}</p>
//     </div>
//   );
// }

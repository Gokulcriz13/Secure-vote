"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function VotePage() {
  const [isValid, setIsValid] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const otu = searchParams?.get("otu") ?? "";
  

  useEffect(() => {
    const validateOTU = async () => {
      const res = await fetch("/api/validate-otu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otu }),
      });

      const data = await res.json();
      if (data.success) {
        setIsValid(true);
        startCamera();
      } else {
        alert("Invalid or expired voting link.");
        router.push("/");
      }
    };

    if (otu) validateOTU();
  }, [otu]);

  const startCamera = () => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    });
  };

  const captureImage = () => {
    if (videoRef.current && images.length < 4) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d")!;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const image = canvas.toDataURL("image/png");
      setImages([...images, image]);
    }
  };

  const handleSubmit = () => {
    router.push("/ai-instructions");
  };

  if (!isValid) return <p className="text-center mt-10">Validating voting link...</p>;

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-gray-50">
      <h1 className="text-2xl font-bold text-blue-700">Face Verification</h1>
      <p className="text-gray-600 mb-4">Capture 4 real-time facial images for Aadhaar match</p>

      <div className="flex gap-4 mb-4 flex-wrap">
        {images.map((img, i) => (
          <img key={i} src={img} alt={`Face ${i + 1}`} className="w-28 h-28 border rounded-md shadow" />
        ))}
      </div>

      {images.length < 4 && (
        <div className="flex flex-col items-center">
          <video ref={videoRef} autoPlay className="w-72 h-56 rounded border shadow" />
          <button
            onClick={captureImage}
            className="mt-4 px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Capture Image
          </button>
        </div>
      )}

      {images.length === 4 && (
        <button
          onClick={handleSubmit}
          className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Proceed to AI Monitoring
        </button>
      )}
    </div>
  );
}

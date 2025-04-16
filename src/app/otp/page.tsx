"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/lib/firebase";
import sha256 from "crypto-js/sha256";

export default function OTPVerification() {
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [otuHash, setOtuHash] = useState<string>("");
  const searchParams = useSearchParams();
  const router = useRouter();

  const phone = searchParams?.get("phone") ?? "";
  const aadhaar = searchParams?.get("aadhaar") ?? "";
  const voterId = searchParams?.get("voterId") ?? "";

  // Generate a one-time URL and hash it with SHA-256
  useEffect(() => {
    if (aadhaar && voterId) {
      const rawOTU = `${aadhaar}-${voterId}-${Date.now()}`;
      const hashedOTU = sha256(rawOTU).toString();
      setOtuHash(hashedOTU);

      // Optionally store the hashed OTU to backend MySQL for validation and vote confirmation
      fetch("/api/store-otu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aadhaar, voterId, otu: hashedOTU }),
      });
    }
  }, [aadhaar, voterId]);

  useEffect(() => {
    if (phone && !(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: (response: any) => {
            console.log("Recaptcha resolved:", response);
          },
        },
      );

      signInWithPhoneNumber(auth, `+91${phone}`, (window as any).recaptchaVerifier)
        .then((result) => {
          setConfirmationResult(result);
          console.log("OTP sent successfully");
        })
        .catch((error) => {
          console.error("Error sending OTP:", error);
        });
    }
  }, [phone]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirmationResult) {
      alert("OTP not sent or expired. Refresh and try again.");
      return;
    }

    try {
      const result = await confirmationResult.confirm(otp);
      console.log("OTP verified successfully:", result.user);
      router.push(`/details?aadhaar=${aadhaar}&voter_id=${voterId}&otu=${otuHash}`);
    } catch (error) {
      console.error("OTP verification failed:", error);
      alert("Invalid OTP. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-200 to-blue-500">
      <form onSubmit={handleVerifyOtp} className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">OTP Verification</h1>

        <p className="text-sm text-gray-600 mb-4 text-center">
          OTP has been sent to your registered mobile number.
        </p>

        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-4 focus:ring-blue-300"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Verify OTP
        </button>

        {/* Hidden div for reCAPTCHA */}
        <div id="recaptcha-container"></div>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
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
  const [countdown, setCountdown] = useState(60);
  const recaptchaInitialized = useRef(false);

  const phone = searchParams?.get("phone") ?? "";
  const aadhaar = searchParams?.get("aadhaar") ?? "";
  const voterId = searchParams?.get("voterId") ?? "";

  // Generate a one-time URL and hash it with SHA-256
  useEffect(() => {
    if (aadhaar && voterId) {
      const rawOTU = `${aadhaar}-${voterId}-${Date.now()}`;
      const hashedOTU = sha256(rawOTU).toString();
      setOtuHash(hashedOTU);

      fetch("/api/store-otu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aadhaar, voterId, otu: hashedOTU }),
      });
    }
  }, [aadhaar, voterId]);

  // reCAPTCHA and OTP
  useEffect(() => {
    const initRecaptchaAndSendOTP = async () => {
      if (phone && !recaptchaInitialized.current) {
        const container = document.getElementById("recaptcha-container");
        if (!container) return;

        try {
          const verifier = new RecaptchaVerifier(auth, container, {
            size: "invisible",
            callback: () => console.log("reCAPTCHA solved"),
          });

          recaptchaInitialized.current = true;

          await verifier.verify();

          const confirmation = await signInWithPhoneNumber(auth, `+91${phone}`, verifier);
          setConfirmationResult(confirmation);
          console.log("OTP sent successfully");
        } catch (error) {
          console.error("Error during reCAPTCHA or OTP send:", error);
          alert("Failed to send OTP. Please try again.");
        }
      }
    };

    initRecaptchaAndSendOTP();
  }, [phone]);

  // OTP Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // OTP Submission
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirmationResult) {
      alert("OTP not sent or expired. Refresh and try again.");
      return;
    }

    try {
      const result = await confirmationResult.confirm(otp);
      console.log("OTP verified successfully:", result.user);

      const rawOTU = `${aadhaar}-${voterId}-${Date.now()}`;
      const newOtuHash = sha256(rawOTU).toString();

      const storeOtuResponse = await fetch("/api/store-otu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aadhaar, voterId, otu: newOtuHash }),
      });

      if (!storeOtuResponse.ok) throw new Error("Failed to store verification token");

      router.push(`/details?aadhaar=${encodeURIComponent(aadhaar)}&voter_id=${encodeURIComponent(voterId)}`);
    } catch (error) {
      console.error("Verification failed:", error);
      alert(error instanceof Error ? error.message : "Verification failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/india-flag-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "brightness(0.85)",
        }}
      />
      <div className="absolute inset-0 bg-white/70 z-10" />
      <div className="container mx-auto px-4 py-16 relative z-20">
        <div className="max-w-md mx-auto bg-white/90 rounded-xl shadow-2xl p-8 backdrop-blur-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 drop-shadow">OTP Verification</h1>
            <p className="text-gray-700">
              Enter the 6-digit code sent to your registered mobile number
            </p>
            <p className="text-gray-700 mt-2">
              {phone ? `+91 ${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}` : ""}
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex justify-center gap-2">
              {[...Array(6)].map((_, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={otp[index] || ""}
                  onChange={(e) => {
                    const newOtp = otp.split("");
                    newOtp[index] = e.target.value;
                    setOtp(newOtp.join(""));
                    if (e.target.value && index < 5) {
                      const nextInput = e.target.nextElementSibling as HTMLInputElement;
                      if (nextInput) nextInput.focus();
                    }
                  }}
                  className="w-12 h-12 text-center text-2xl bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              ))}
            </div>

            <div className="text-center">
              <p className="text-gray-700">
                {countdown > 0 ? (
                  <>OTP expires in <span className="text-blue-600">{countdown}s</span></>
                ) : (
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Resend OTP
                  </button>
                )}
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white"
            >
              Verify OTP
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push("/authenticate")}
                className="text-gray-600 hover:text-blue-600 text-sm transition-colors"
              >
                Back to Authentication
              </button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-blue-600 font-semibold mb-2">Security Information</h3>
            <p className="text-gray-600 text-sm">
              Your OTP is valid for a single use and will expire shortly for your security.
            </p>
          </div>
        </div>
      </div>

      {/* Required for reCAPTCHA */}
      <div id="recaptcha-container" className="hidden" />
    </div>
  );
}

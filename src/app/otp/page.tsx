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
  const [countdown, setCountdown] = useState(60);
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
    const initRecaptchaAndSendOTP = async () => {
      if (phone && !(window as any).recaptchaVerifier) {
        const recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
            callback: () => {
              console.log("reCAPTCHA verified");
            },
          },
        );

        (window as any).recaptchaVerifier = recaptchaVerifier;

        try {
          await recaptchaVerifier.verify();

          const confirmation = await signInWithPhoneNumber(
            auth,
            `+91${phone}`,
            recaptchaVerifier
          );

          setConfirmationResult(confirmation);
          console.log("OTP sent successfully");
        } catch (error) {
          console.error("Error during reCAPTCHA or OTP send:", error);
        }
      }
    };

    initRecaptchaAndSendOTP();
  }, [phone]);

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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirmationResult) {
      alert("OTP not sent or expired. Refresh and try again.");
      return;
    }

    try {
      // Verify OTP
      const result = await confirmationResult.confirm(otp);
      console.log("OTP verified successfully:", result.user);

      // Generate new OTU
      const rawOTU = `${aadhaar}-${voterId}-${Date.now()}`;
      const newOtuHash = sha256(rawOTU).toString();

      // Store OTU in database
      const storeOtuResponse = await fetch("/api/store-otu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          aadhaar, 
          voterId, 
          otu: newOtuHash 
        }),
      });

      if (!storeOtuResponse.ok) {
        throw new Error("Failed to store verification token");
      }

      // Redirect to details page with the correct parameters
      const detailsUrl = `/details?aadhaar=${encodeURIComponent(aadhaar)}&voter_id=${encodeURIComponent(voterId)}`;
      console.log("Redirecting to:", detailsUrl);
      router.push(detailsUrl);
    } catch (error) {
      console.error("Verification failed:", error);
      alert(error instanceof Error ? error.message : "Verification failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">OTP Verification</h1>
            <p className="text-gray-400">
              Enter the 6-digit code sent to your registered mobile number
            </p>
            <p className="text-gray-400 mt-2">
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
                  className="w-12 h-12 text-center text-2xl bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              ))}
            </div>

            <div className="text-center">
              <p className="text-gray-400">
                {countdown > 0 ? (
                  <>OTP expires in <span className="text-blue-400">{countdown}s</span></>
                ) : (
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Resend OTP
                  </button>
                )}
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Verify OTP
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push("/authenticate")}
                className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
              >
                Back to Authentication
              </button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
            <h3 className="text-blue-400 font-semibold mb-2">Security Information</h3>
            <p className="text-gray-400 text-sm">
              The OTP is valid for 60 seconds. Do not share this code with anyone.
            </p>
          </div>

          <div id="recaptcha-container" className="hidden"></div>
        </div>
      </div>
    </div>
  );
} 
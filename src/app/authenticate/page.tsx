"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VoterVerificationPage() {
  const [aadhaar, setAadhaar] = useState("");
  const [voterId, setVoterId] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const res = await fetch("/api/verify-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aadhaar, voterId }),
    });
  
    const data = await res.json();
    if (res.ok) {
      router.push(`/otp?phone=${data.phone}&aadhaar=${aadhaar}&voterId=${voterId}`);
    } else {
      alert("User not found");
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/india-flag-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(0.85)',
        }}
      />
      {/* Overlay for contrast */}
      <div className="absolute inset-0 bg-white/70 z-10" />
      <div className="container mx-auto px-4 py-16 relative z-20">
        <div className="max-w-md mx-auto bg-white/90 rounded-xl shadow-2xl p-8 backdrop-blur-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 drop-shadow">Voter Authentication</h1>
            <p className="text-gray-700">Enter your credentials to begin the voting process</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aadhaar Number
                </label>
                <input
                  type="text"
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value)}
                  maxLength={12}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter 12-digit Aadhaar number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voter ID
                </label>
                <input
                  type="text"
                  value={voterId}
                  onChange={(e) => setVoterId(e.target.value)}
                  maxLength={10}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter Voter ID"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white"
            >
              Verify Identity
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-gray-600 hover:text-blue-600 text-sm transition-colors"
              >
                Back to Home
              </button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-blue-600 font-semibold mb-2">Security Notice</h3>
            <p className="text-gray-600 text-sm">
              Your information is protected using advanced encryption and will only be used for voter verification purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
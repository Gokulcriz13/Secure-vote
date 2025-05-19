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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500 relative overflow-hidden">
      {/* Overlay */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm z-0" />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
          {/* Form Card */}
          <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-10 transform transition hover:scale-[1.01] duration-300">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-extrabold text-indigo-700 drop-shadow-lg">Voter Authentication</h1>
              <p className="mt-2 text-gray-600">Secure your vote by verifying your identity</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    value={aadhaar}
                    onChange={(e) => setAadhaar(e.target.value)}
                    maxLength={12}
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter 12-digit Aadhaar number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Voter ID
                  </label>
                  <input
                    type="text"
                    value={voterId}
                    onChange={(e) => setVoterId(e.target.value)}
                    maxLength={10}
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter Voter ID"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Verify Identity
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  ← Back to Home
                </button>
              </div>
            </form>

            <div className="mt-10 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
              <h3 className="text-indigo-700 font-bold mb-1">🔒 Security Notice</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Your credentials are protected using advanced encryption and will only be used for voter verification.
              </p>
            </div>
          </div>

          {/* Image or Illustration */}
          <div className="hidden lg:block w-full max-w-sm">
            <img
              src="/image.png"
              alt="Voting Illustration"
              className="rounded-3xl shadow-xl object-cover w-full h-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

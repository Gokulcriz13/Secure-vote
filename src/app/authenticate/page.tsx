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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Voter Authentication</h1>
            <p className="text-gray-400">Enter your credentials to begin the voting process</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Aadhaar Number
                </label>
                <input
                  type="text"
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value)}
                  maxLength={12}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter 12-digit Aadhaar number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Voter ID
                </label>
                <input
                  type="text"
                  value={voterId}
                  onChange={(e) => setVoterId(e.target.value)}
                  maxLength={10}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter Voter ID"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Verify Identity
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
              >
                Back to Home
              </button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
            <h3 className="text-blue-400 font-semibold mb-2">Security Notice</h3>
            <p className="text-gray-400 text-sm">
              Your information is protected using advanced encryption and will only be used for voter verification purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
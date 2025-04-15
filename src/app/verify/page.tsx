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
    <div className="flex items-center justify-center min-h-screen bg-[#1D1616] p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[#EEEEEE] p-8 rounded-xl shadow-xl max-w-md w-full"
      >
        <h1 className="text-3xl font-bold text-center text-[#8E1616] mb-6">
          Voter Authentication
        </h1>

        <label className="block text-[#1D1616] mb-2">Aadhaar Number</label>
        <input
          type="text"
          value={aadhaar}
          onChange={(e) => setAadhaar(e.target.value)}
          maxLength={12}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4"
          required
        />

        <label className="block text-[#1D1616] mb-2">Voter ID</label>
        <input
          type="text"
          value={voterId}
          onChange={(e) => setVoterId(e.target.value)}
          maxLength={10}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4"
          required
        />

        <button
          type="submit"
          className="w-full bg-[#D84040] text-white py-3 rounded-lg hover:bg-[#8E1616] transition-transform hover:scale-105"
        >
          Verify
        </button>
      </form>
    </div>
  );
}
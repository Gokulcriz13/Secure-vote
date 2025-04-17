"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#111111] p-8">
      <div className="text-center bg-[#EEEEEE] p-10 rounded-2xl shadow-xl max-w-lg w-full">
        <h1 className="text-4xl font-bold text-[#8E1616] mb-6">Secure Online Voting System</h1>
        <p className="text-[#1D1616] text-lg mb-8">
          Welcome to the future of voting! Our system ensures security, privacy,
          and transparency for every voter.
        </p>
        <button
          onClick={() => router.push("/authenticate")}
          className="bg-[#D84040] text-white py-3 px-6 rounded-lg text-lg hover:bg-[#8E1616] transition-transform hover:scale-105"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
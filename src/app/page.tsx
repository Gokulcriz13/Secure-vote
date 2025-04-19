"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Content */}
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <h1 className="text-5xl font-bold text-white leading-tight">
              Secure Your Vote with
              <span className="text-blue-400 block">Blockchain Technology</span>
            </h1>
            
            <p className="text-gray-300 text-lg max-w-2xl">
              Experience the future of voting with our secure, transparent, and verifiable remote voting system. 
              Your vote matters, and we ensure it's protected.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={() => router.push("/authenticate")}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                Start Voting
              </button>
              <button
                onClick={() => router.push("/instructions")}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300"
              >
                How It Works
              </button>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mt-12">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h3 className="text-blue-400 font-semibold">Secure</h3>
                <p className="text-gray-300 text-sm">Multi-factor authentication</p>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h3 className="text-blue-400 font-semibold">Transparent</h3>
                <p className="text-gray-300 text-sm">Blockchain verified</p>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h3 className="text-blue-400 font-semibold">Accessible</h3>
                <p className="text-gray-300 text-sm">Vote from anywhere</p>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h3 className="text-blue-400 font-semibold">Private</h3>
                <p className="text-gray-300 text-sm">Your vote is confidential</p>
              </div>
            </div>
          </div>

          {/* Right Content - Placeholder for illustration */}
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-md h-96 bg-gray-800/50 rounded-2xl flex items-center justify-center">
              <span className="text-gray-400">Secure Voting Illustration</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
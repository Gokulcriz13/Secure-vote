"use client";

import { useRouter } from "next/navigation";

export default function InstructionsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Voting Instructions</h1>
            <p className="text-gray-400">
              Please follow these instructions carefully to complete your vote
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Step-by-Step Guide</h2>
            <ol className="space-y-4 text-gray-300">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">1</span>
                <div>
                  <h3 className="font-semibold text-white">Authentication</h3>
                  <p>Enter your Aadhaar number and Voter ID to verify your identity</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">2</span>
                <div>
                  <h3 className="font-semibold text-white">OTP Verification</h3>
                  <p>Verify your phone number with the OTP sent to your registered mobile</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">3</span>
                <div>
                  <h3 className="font-semibold text-white">Face Verification</h3>
                  <p>Allow camera access and position your face in the frame for verification</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">4</span>
                <div>
                  <h3 className="font-semibold text-white">Cast Your Vote</h3>
                  <p>Select your preferred candidate and confirm your vote</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-gray-800 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Important Notes</h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>Ensure you have a stable internet connection</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>Use a well-lit environment for face verification</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>Keep your Aadhaar and Voter ID cards ready</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>Your vote is confidential and secure</span>
              </li>
            </ul>
          </div>

          <div className="text-center">
            <button
              onClick={() => router.push("/authenticate")}
              className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Start Voting Process
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

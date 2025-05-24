 "use client";

import { useRouter } from "next/navigation";

export default function InstructionsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500 relative overflow-hidden">
      {/* Overlay */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm z-0" />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-10 transform transition hover:scale-[1.01] duration-300">
          <h1 className="text-4xl font-extrabold text-indigo-700 drop-shadow-lg mb-10 text-center">
            Face Verification Instructions
          </h1>

          <div className="space-y-8">
            {/* Environment Requirements */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-indigo-600 mb-4">
                Environment Requirements
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Ensure you are in a well-lit area
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Position yourself in front of a plain background
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Remove any face coverings (masks, sunglasses, etc.)
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Make sure your face is clearly visible to the camera
                </li>
              </ul>
            </div>

            {/* Verification Steps */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-indigo-600 mb-4">
                Verification Steps
              </h2>
              <div className="space-y-6 text-gray-700">
                {[ 
                  { step: "1", title: "Position Your Face", desc: "Center your face in the camera frame. Make sure your entire face is visible and not cut off." },
                  { step: "2", title: "Blink Naturally", desc: "Blink your eyes naturally 2 times. The system will detect your blinks automatically." },
                  { step: "3", title: "Move Your Head", desc: "Gently move your head slightly left and right. This helps verify that you are a real person and not a photo." }
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                      {step}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-indigo-700 mb-1">{title}</h3>
                      <p>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Information */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-indigo-600 mb-4">
                Security Information
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">⚠</span>
                  Your face data is processed securely and not stored permanently
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">⚠</span>
                  Verification must be completed within 5 minutes
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">⚠</span>
                  Photos or videos will not work - the system requires live interaction
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 mt-10">
              <button
                onClick={() => router.push("/face-capture")}
                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105"
              >
                Start Verification
              </button>
              <button
                onClick={() => router.push("/")}
                className="px-8 py-3 bg-gray-200 text-gray-800 font-semibold rounded-xl shadow-md hover:bg-gray-300 transition-all"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function InstructionsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800/50 rounded-xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">
            Face Verification Instructions
          </h1>

          <div className="space-y-8">
            {/* Environment Requirements */}
            <div className="bg-gray-700/30 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-blue-400 mb-4">
                Environment Requirements
              </h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Ensure you are in a well-lit area</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Position yourself in front of a plain background</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Remove any face coverings (masks, sunglasses, etc.)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Make sure your face is clearly visible to the camera</span>
                </li>
              </ul>
            </div>

            {/* Verification Steps */}
            <div className="bg-gray-700/30 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-blue-400 mb-4">
                Verification Steps
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-white mb-2">
                      Position Your Face
                    </h3>
                    <p className="text-gray-300">
                      Center your face in the camera frame. Make sure your entire face is visible and not cut off.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-white mb-2">
                      Blink Naturally
                    </h3>
                    <p className="text-gray-300">
                      Blink your eyes naturally 2 times. The system will detect your blinks automatically.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-white mb-2">
                      Move Your Head
                    </h3>
                    <p className="text-gray-300">
                      Gently move your head slightly left and right. This helps verify that you are a real person and not a photo.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Information */}
            <div className="bg-gray-700/30 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-blue-400 mb-4">
                Security Information
              </h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">⚠</span>
                  <span>Your face data is processed securely and not stored permanently</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">⚠</span>
                  <span>Verification must be completed within 5 minutes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">⚠</span>
                  <span>Photos or videos will not work - the system requires live interaction</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 mt-8">
              <button
                onClick={() => router.push('/face-capture')}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Start Verification
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-8 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
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

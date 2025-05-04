// src/app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";

export default function LandingPage() {
  const router = useRouter();
  
  return (
    <>
      {/* Splash Cursor Script */}
      <Script
        src="https://21st.dev/DavidHDev/splash-cursor/default/splash-cursor.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== "undefined" && (window as any).SplashCursor) {
            (window as any).SplashCursor();
          }
        }}
      />

      <div
        className="min-h-screen flex items-center justify-center bg-white"
      >
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            
            {/* Left Content */}
            <div className="flex-1 space-y-8 text-center lg:text-left">
              
              {/* Animated Hero */}
              <h1 className="text-5xl font-bold text-gray-900 leading-tight animate-pulse">
                Empower Your Voice with
                <span className="text-blue-600 block animate-gradient">
                  India's Secure Voting
                </span>
              </h1>

              <p className="text-gray-700 text-lg max-w-2xl">
                Witness the transformation of democracy. <br />
                Secure, transparent, and accessible — your vote is your power!
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => router.push("/authenticate")}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:scale-110 transition-all text-white font-bold py-3 px-8 rounded-full shadow-lg"
                >
                  Start Voting
                </button>
                <button
                  onClick={() => router.push("/instructions")}
                  className="bg-gray-100 hover:bg-blue-100 text-gray-900 hover:text-blue-600 font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300"
                >
                  How It Works
                </button>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-6 mt-12">
                <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-200">
                  <h3 className="text-blue-600 font-bold text-xl">Secure</h3>
                  <p className="text-gray-600 text-sm mt-2">Multi-factor authentication to protect your vote.</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-200">
                  <h3 className="text-green-600 font-bold text-xl">Transparent</h3>
                  <p className="text-gray-600 text-sm mt-2">Blockchain verified voting ledger.</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-200">
                  <h3 className="text-purple-600 font-bold text-xl">Accessible</h3>
                  <p className="text-gray-600 text-sm mt-2">Vote securely from anywhere across India.</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-200">
                  <h3 className="text-orange-600 font-bold text-xl">Private</h3>
                  <p className="text-gray-600 text-sm mt-2">Absolute anonymity of your choice.</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Custom Styles for animated gradient text */}
      <style jsx global>{`
        .animate-gradient {
          background: linear-gradient(270deg, #3b82f6, #10b981, #8b5cf6, #3b82f6);
          background-size: 800% 800%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientMove 6s ease infinite;
        }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </>
  );
}
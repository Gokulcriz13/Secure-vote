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
        className="min-h-screen bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
          backgroundImage: "url('/indian-voting-bg.jpeg')"
        }}
      >
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            
            {/* Left Content */}
            <div className="flex-1 space-y-8 text-center lg:text-left">
              
              {/* Animated Hero */}
              <h1 className="text-5xl font-bold text-white leading-tight animate-pulse">
                Empower Your Voice with
                <span className="text-orange-400 block animate-gradient">
                  India's Secure Voting
                </span>
              </h1>

              <p className="text-gray-100 text-lg max-w-2xl">
                Witness the transformation of democracy. <br />
                Secure, transparent, and accessible — your vote is your power!
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => router.push("/authenticate")}
                  className="bg-gradient-to-r from-green-400 via-yellow-400 to-orange-500 hover:scale-110 transition-all text-white font-bold py-3 px-8 rounded-full shadow-lg"
                >
                  Start Voting
                </button>
                <button
                  onClick={() => router.push("/instructions")}
                  className="bg-white hover:bg-orange-300 text-gray-900 hover:text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300"
                >
                  How It Works
                </button>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-6 mt-12">
                <div className="bg-white/20 p-6 rounded-xl text-center backdrop-blur-md">
                  <h3 className="text-orange-300 font-bold text-xl">Secure</h3>
                  <p className="text-gray-200 text-sm mt-2">Multi-factor authentication to protect your vote.</p>
                </div>
                <div className="bg-white/20 p-6 rounded-xl text-center backdrop-blur-md">
                  <h3 className="text-green-300 font-bold text-xl">Transparent</h3>
                  <p className="text-gray-200 text-sm mt-2">Blockchain verified voting ledger.</p>
                </div>
                <div className="bg-white/20 p-6 rounded-xl text-center backdrop-blur-md">
                  <h3 className="text-blue-300 font-bold text-xl">Accessible</h3>
                  <p className="text-gray-200 text-sm mt-2">Vote securely from anywhere across India.</p>
                </div>
                <div className="bg-white/20 p-6 rounded-xl text-center backdrop-blur-md">
                  <h3 className="text-yellow-300 font-bold text-xl">Private</h3>
                  <p className="text-gray-200 text-sm mt-2">Absolute anonymity of your choice.</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Custom Styles for animated gradient text */}
      <style jsx global>{`
        .animate-gradient {
          background: linear-gradient(270deg, #f59e0b, #10b981, #3b82f6, #f59e0b);
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
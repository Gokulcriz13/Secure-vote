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

      {/* Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div
            className="text-2xl font-bold text-blue-600 cursor-pointer"
            onClick={() => router.push("/")}
          >
            eVote India
          </div>
          <ul className="flex gap-6 text-gray-700 font-semibold">
            <li
              className="cursor-pointer hover:text-blue-600 transition"
              onClick={() => router.push("/")}
            >
              Home
            </li>
            <li
              className="cursor-pointer hover:text-blue-600 transition"
              onClick={() => router.push("/about")}
            >
              About
            </li>
            <li 
              className="cursor-pointer hover:text-blue-600 transition"
              onClick={() => router.push("/contact")}
            >
              Contact Us
            </li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="min-h-screen flex items-center justify-center bg-[#d1e9f8]">
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">

            {/* Left Content */}
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Empower Your Voice with
                <span className="text-green-600 block animate-gradient">
                  India’s Secure Voting
                </span>
              </h1>

              <p className="text-gray-700 text-lg max-w-2xl">
                Witness the transformation of democracy. <br />
                Secure, transparent, and accessible - your vote is your power!
              </p>

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
            </div>

            {/* Right Image */}
            <div className="flex-1 flex justify-center">
              <img
                src="/vote-image.jpg"
                alt="Right to Vote"
                className="w-64 h-auto object-contain"
              />
            </div>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            <div className="bg-white p-6 rounded-xl text-center border border-gray-200 shadow">
              <h3 className="text-blue-600 font-bold text-lg">Secure</h3>
              <p className="text-gray-600 text-sm mt-2">
                Multi-factor authentication to protect your vote.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl text-center border border-gray-200 shadow">
              <h3 className="text-green-600 font-bold text-lg">Transparent</h3>
              <p className="text-gray-600 text-sm mt-2">
                Blockchain verified voting ledger.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl text-center border border-gray-200 shadow">
              <h3 className="text-purple-600 font-bold text-lg">Accessible</h3>
              <p className="text-gray-600 text-sm mt-2">
                Vote securely from anywhere across India.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl text-center border border-gray-200 shadow">
              <h3 className="text-orange-600 font-bold text-lg">Private</h3>
              <p className="text-gray-600 text-sm mt-2">
                Absolute anonymity of your choice.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gradient Text Animation */}
      <style jsx global>{`
        .animate-gradient {
          background: linear-gradient(270deg, #3b82f6, #10b981, #8b5cf6, #3b82f6);
          background-size: 800% 800%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientMove 6s ease infinite;
        }

        @keyframes gradientMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </>
  );
}

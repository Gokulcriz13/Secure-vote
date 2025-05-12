// about/page.tsx
"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { ShieldCheck, Globe, LockKeyhole, Users } from "lucide-react";

export default function AboutPage() {
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
            <li className="cursor-pointer hover:text-blue-600 transition" onClick={() => router.push("/")}>Home</li>
            <li className="cursor-pointer hover:text-blue-600 transition" onClick={() => router.push("/about")}>About</li>
            <li className="cursor-pointer hover:text-blue-600 transition" onClick={() => router.push("/contact")}>Contact Us</li>
          </ul>
        </div>
      </nav>

      {/* About Section with Background Image */}
      <div
        className="min-h-screen bg-cover bg-center bg-no-repeat py-16 px-6 sm:px-10"
        style={{
          backgroundImage: "url('/about-bg.jpg')",
        }}
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-xl max-w-7xl mx-auto p-8 md:p-16 shadow-lg">
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-extrabold text-blue-700 mb-4">About eVote India</h1>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              eVote India is a secure, transparent, and innovative online voting platform designed to strengthen democracy by making the voting process accessible and trustworthy for every Indian citizen.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="bg-white p-6 rounded-xl border shadow text-center">
              <ShieldCheck className="mx-auto text-blue-600 w-8 h-8" />
              <h3 className="font-bold mt-4 text-blue-600">Security</h3>
              <p className="text-gray-600 text-sm mt-2">
                End-to-end encryption & multi-factor authentication safeguard your vote.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border shadow text-center">
              <Globe className="mx-auto text-green-600 w-8 h-8" />
              <h3 className="font-bold mt-4 text-green-600">Transparency</h3>
              <p className="text-gray-600 text-sm mt-2">
                Blockchain ledger ensures every vote is verifiable and auditable.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border shadow text-center">
              <Users className="mx-auto text-purple-600 w-8 h-8" />
              <h3 className="font-bold mt-4 text-purple-600">Accessibility</h3>
              <p className="text-gray-600 text-sm mt-2">
                Cast your vote securely from anywhere in India.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border shadow text-center">
              <LockKeyhole className="mx-auto text-orange-600 w-8 h-8" />
              <h3 className="font-bold mt-4 text-orange-600">Privacy</h3>
              <p className="text-gray-600 text-sm mt-2">
                We protect your identity while preserving the power of your voice.
              </p>
            </div>
          </div>

          {/* Vision & Mission */}
          <div className="space-y-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-700 mb-3">Our Vision</h2>
              <p className="text-lg text-gray-700 max-w-4xl">
                To build a future where every citizen can vote with confidence, clarity, and convenience—leveraging technology to create a transparent and inclusive democracy.
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-700 mb-3">Our Mission</h2>
              <p className="text-lg text-gray-700 max-w-4xl">
                We aim to deliver a seamless online voting experience by integrating modern cryptography, blockchain verification, and user-friendly interfaces—ensuring every vote is counted, every time.
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-700 mb-3">Core Values</h2>
              <ul className="list-disc list-inside text-lg text-gray-700 space-y-2">
                <li><strong>Integrity:</strong> Building trust through verifiability and openness.</li>
                <li><strong>Inclusivity:</strong> Ensuring equal access for all eligible citizens.</li>
                <li><strong>Innovation:</strong> Continuously evolving with emerging technology.</li>
                <li><strong>Accountability:</strong> Empowering citizens and protecting their rights.</li>
              </ul>
            </div>
          </div>
        </div>
     <div className="flex justify-center mt-8">
     <button
    onClick={() => router.push("/contact")}
    className="bg-gray-100 hover:bg-blue-100 text-gray-900 hover:text-blue-600 font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300"
      >
      Contact Us
    </button>
      </div>
      </div>
    </>
  );
}

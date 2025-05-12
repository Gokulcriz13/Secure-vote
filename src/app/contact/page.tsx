// pages/contact.tsx
"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Contact() {
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

      {/* Contact Section with Background Image */}
      <div
        className="min-h-screen bg-cover bg-center bg-no-repeat py-16 px-6 sm:px-10"
        style={{ backgroundImage: "url('/about-bg.jpg')" }}
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-xl max-w-7xl mx-auto p-8 md:p-16 shadow-lg">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-extrabold text-blue-700 drop-shadow-md mb-4">Contact Us</h1>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Have a question, feedback, or just want to connect? We're here to help you. Reach out to us using the form or the contact details below.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Contact Form */}
            <div className="bg-white p-8 rounded-xl border shadow text-gray-800">
              <form className="space-y-6">
                <div>
                  <label className="block font-semibold mb-1">Your Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Your Message</label>
                  <textarea
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="How can we help you?"
                    required
                  ></textarea>
                </div>

                <div className="flex justify-center mt-4">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:scale-105 transition-all text-white font-bold py-3 px-8 rounded-full shadow-lg"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-6 text-gray-700">
              <div className="flex items-start gap-4">
                <MapPin className="text-blue-600 w-6 h-6 mt-1" />
                <div>
                  <h3 className="font-bold text-lg text-blue-700">Our Office</h3>
                  <p>123 Democracy Avenue, New Delhi, India</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="text-green-600 w-6 h-6 mt-1" />
                <div>
                  <h3 className="font-bold text-lg text-green-700">Phone</h3>
                  <p>+91 98765 43210</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="text-yellow-500 w-6 h-6 mt-1" />
                <div>
                  <h3 className="font-bold text-lg text-yellow-600">Email</h3>
                  <p>support@evoteindia.in</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

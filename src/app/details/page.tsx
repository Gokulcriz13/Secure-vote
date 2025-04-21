"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Voter = {
  name: string;
  aadhaar: string;
  voter_id: string;
  phone: string;
  address: string;
  gender: string;
  dob: string;
  photo: string;
  otu?: string;
  hashed_otu: string;
}

export default function VoterDetailsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const aadhaar = searchParams?.get("aadhaar") ?? "";
  const voterId = searchParams?.get("voter_id") ?? "";
  const [voter, setVoter] = useState<Voter | null>(null);

  useEffect(() => {
    if (aadhaar && voterId) {
      fetch("/api/fetch-voter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aadhaar, voterId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setVoter(data.voter);
        })
        .catch((err) => console.error("Failed to fetch voter:", err));
    }
  }, [aadhaar, voterId]);

  if (!voter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-blue-400 text-xl">Loading voter details...</div>
          <div className="mt-4 w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Voter Details</h1>
            <p className="text-gray-400">Please verify your information before proceeding</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-8 space-y-8">
            {/* Profile Section */}
            <div className="flex flex-col items-center">
              {voter.photo ? (
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500">
                    <img
                      src={`data:image/jpeg;base64,${voter.photo}`}
                      alt="Voter Photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center border-4 border-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <h2 className="text-2xl font-semibold text-white mt-4">{voter.name}</h2>
              <p className="text-gray-400">{voter.gender} • {voter.dob}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="text-blue-400 font-semibold mb-2">Identification</h3>
                <div className="space-y-2 text-gray-300">
                  <p><span className="text-gray-400">Aadhaar:</span> {voter.aadhaar}</p>
                  <p><span className="text-gray-400">Voter ID:</span> {voter.voter_id}</p>
                </div>
              </div>

              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="text-blue-400 font-semibold mb-2">Contact</h3>
                <div className="space-y-2 text-gray-300">
                  <p><span className="text-gray-400">Phone:</span> +91-{voter.phone}</p>
                  <p><span className="text-gray-400">Address:</span> {voter.address}</p>
                </div>
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h3 className="text-blue-400 font-semibold mb-2">Security Status</h3>
              <div className="flex items-center space-x-2 text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Identity verified and secured</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push(`/face-capture?otu=${encodeURIComponent(voter.hashed_otu)}`)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                Continue to Vote
              </button>
              <button
                onClick={() => router.push("/authenticate")}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300"
              >
                Back to Authentication
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
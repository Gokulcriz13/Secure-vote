"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyFace } from "@/lib/faceutils";
import Image from "next/image";

// Define types for better type safety
type Candidate = {
  id: string;
  name: string;
  party: string;
  partyShortName: string;
  symbol: string;
};

type VoterDetails = {
  name: string;
  voter_id: string;
  aadhaar: string;
  constituency: string;
  ward_number: string;
  booth_number: string;
  phone: string;
  address: string;
};

// Mock candidate data (in production, this would come from an API)
const CANDIDATES: Candidate[] = [
  {
    id: "1",
    name: "Narendra Modi",
    party: "Bharatiya Janata Party",
    partyShortName: "BJP",
    symbol: "/images/parties/bjp.svg"
  },
  {
    id: "2",
    name: "Rahul Gandhi",
    party: "Indian National Congress",
    partyShortName: "INC",
    symbol: "/images/parties/congress.svg"
  },
  {
    id: "3",
    name: "Arvind Kejriwal",
    party: "Aam Aadmi Party",
    partyShortName: "AAP",
    symbol: "/images/parties/aap.svg"
  },
  {
    id: "4",
    name: "Mamata Banerjee",
    party: "All India Trinamool Congress",
    partyShortName: "TMC",
    symbol: "/images/parties/tmc.svg"
  }
];

export default function VotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const otu = searchParams?.get("otu");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voterDetails, setVoterDetails] = useState<VoterDetails | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  useEffect(() => {
    const verifyAndLoadVoter = async () => {
      try {
        if (!otu || otu === 'undefined') {
          throw new Error("Invalid or missing verification token. Please complete face verification again.");
        }

        // Fetch voter details first
        const response = await fetch(`/api/fetch-voter?otu=${encodeURIComponent(otu)}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch voter details");
        }

        const data = await response.json();
        if (!data.success || !data.voter) {
          throw new Error(data.error || "Failed to fetch voter details");
        }

        // Set voter details including constituency, ward, and booth
        setVoterDetails(data.voter);

        // Get stored face descriptor
        const storedDescriptor = sessionStorage.getItem('faceDescriptor');
        if (!storedDescriptor) {
          throw new Error("Face verification data not found. Please complete face verification again.");
        }

        // Check if verification is recent (within 5 minutes)
        const lastVerification = sessionStorage.getItem('lastVerification');
        if (lastVerification) {
          const verificationTime = parseInt(lastVerification);
          const currentTime = Date.now();
          if (currentTime - verificationTime > 5 * 60 * 1000) { // 5 minutes
            throw new Error("Face verification has expired. Please verify again.");
          }
        }

        // Clear the descriptor immediately after retrieving it
        sessionStorage.removeItem('faceDescriptor');

        const descriptor = JSON.parse(storedDescriptor);
        const float32Descriptor = new Float32Array(descriptor);
        
        // Verify face with stored descriptor
        const verificationResult = await verifyFace(data.voter.aadhaar, data.voter.voter_id, float32Descriptor);
        
        if (!verificationResult.isMatch) {
          throw new Error(`Face verification failed: ${verificationResult.message}`);
        }

        // Store verification timestamp
        sessionStorage.setItem('lastVerification', Date.now().toString());

        setIsLoading(false);
      } catch (error) {
        console.error("Verification error:", error);
        setError(error instanceof Error ? error.message : "An error occurred during verification");
        setIsLoading(false);
      }
    };

    verifyAndLoadVoter();
  }, [otu]);

  const handleVote = async () => {
    if (!selectedCandidate) {
      setError("Please select a candidate to vote");
      return;
    }

    try {
      const response = await fetch('/api/submit-vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otu,
          candidateId: selectedCandidate,
          voterId: voterDetails?.voter_id
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit vote");
      }

      // Clear session storage and redirect to success page
      sessionStorage.removeItem('faceDescriptor');
      router.push('/vote-success');
    } catch (error) {
      console.error("Vote submission error:", error);
      setError(error instanceof Error ? error.message : "Failed to submit vote");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-300">Verifying your identity...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Verification Failed</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/face-capture')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 shadow-xl rounded-xl p-8">
          <h1 className="text-3xl font-bold text-white mb-8">Cast Your Vote</h1>
          
          {/* Voter Information */}
          <div className="mb-10 bg-gray-700/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-400 mb-4">Voter Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-400">Name</p>
                <p className="text-white font-medium text-lg">{voterDetails?.name}</p>
              </div>
              <div>
                <p className="text-gray-400">Voter ID</p>
                <p className="text-white font-medium text-lg">{voterDetails?.voter_id}</p>
              </div>
              <div>
                <p className="text-gray-400">Constituency</p>
                <p className="text-white font-medium text-lg">{voterDetails?.constituency}</p>
              </div>
              <div>
                <p className="text-gray-400">Verification Status</p>
                <p className="text-green-400 font-medium text-lg">Verified</p>
              </div>
              <div>
                <p className="text-gray-400">Ward Number</p>
                <p className="text-white font-medium text-lg">{voterDetails?.ward_number}</p>
              </div>
              <div>
                <p className="text-gray-400">Booth Number</p>
                <p className="text-white font-medium text-lg">{voterDetails?.booth_number}</p>
              </div>
              <div>
                <p className="text-gray-400">Address</p>
                <p className="text-white font-medium text-lg">{voterDetails?.address}</p>
              </div>
              <div>
                <p className="text-gray-400">Phone</p>
                <p className="text-white font-medium text-lg">+91 {voterDetails?.phone}</p>
              </div>
            </div>
          </div>

          {/* Candidate Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-blue-400 mb-6">Select Candidate</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CANDIDATES.map((candidate) => (
                <div
                  key={candidate.id}
                  className={`p-4 rounded-lg cursor-pointer transition-all transform hover:scale-105 ${
                    selectedCandidate === candidate.id
                      ? 'bg-blue-600 border-2 border-blue-400'
                      : 'bg-gray-700/50 hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedCandidate(candidate.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden">
                      <Image
                        src={candidate.symbol}
                        alt={`${candidate.party} symbol`}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-white">{candidate.name}</p>
                      <p className="text-sm text-gray-300">{candidate.party}</p>
                      <p className="text-xs text-blue-400 mt-1">{candidate.partyShortName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={handleVote}
              disabled={!selectedCandidate}
              className={`px-8 py-3 rounded-lg text-white font-medium transition-all transform hover:scale-105 ${
                selectedCandidate
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              Submit Vote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
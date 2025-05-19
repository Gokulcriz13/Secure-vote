//src/app/voting/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyFace } from "@/lib/server/face-processing";
import Image from "next/image";

export default function VotingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const otu = searchParams?.get("otu");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voterDetails, setVoterDetails] = useState<any>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [voteSubmitted, setVoteSubmitted] = useState(false);

  useEffect(() => {
    const verifyAndLoadVoter = async () => {
      try {
        if (!otu) {
          throw new Error("Invalid or missing verification token");
        }

        // Fetch voter details first
        const response = await fetch(`/api/fetch-voter?otu=${encodeURIComponent(otu)}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch voter details");
        }

        const data = await response.json();
        setVoterDetails(data);

        // Get stored face descriptor
        const storedDescriptor = sessionStorage.getItem('faceDescriptor');
        if (!storedDescriptor) {
          throw new Error("Face verification data not found. Please complete face verification again.");
        }

        const descriptor = JSON.parse(storedDescriptor);
        
        // Convert descriptor to Float32Array
        const float32Descriptor = new Float32Array(descriptor);
        
        // Verify face with stored descriptor
        const verificationResult = await verifyFace(data.aadhaar, data.voter_id, Array.from(float32Descriptor));
        
        if (!verificationResult.match) {
          throw new Error("Face verification failed. Please try again.");
        }

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
      setVoteSubmitted(true);
      const response = await fetch('/api/submit-vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otu,
          candidateId: selectedCandidate,
          voterId: voterDetails.voter_id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit vote");
      }

      // Clear session storage and redirect to success page
      sessionStorage.removeItem('faceDescriptor');
      router.push('/vote-success');
    } catch (error) {
      console.error("Vote submission error:", error);
      setError(error instanceof Error ? error.message : "Failed to submit vote");
      setVoteSubmitted(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-blue-400 text-lg">Verifying your identity...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="bg-gray-800/50 p-8 rounded-xl shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Verification Failed</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/face-capture')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300"
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
        <div className="bg-gray-800/50 shadow-xl rounded-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Cast Your Vote</h1>
            <div className="text-green-400 font-semibold">
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            </div>
          </div>
          
          <div className="mb-8 bg-gray-700/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Voter Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-gray-400">Name</p>
                <p className="text-white font-medium">{voterDetails?.name}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-400">Voter ID</p>
                <p className="text-white font-medium">{voterDetails?.voter_id}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-400">Constituency</p>
                <p className="text-white font-medium">{voterDetails?.constituency}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-400">Verification Status</p>
                <p className="text-green-400 font-medium">Verified</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">Select Your Candidate</h2>
            <div className="space-y-4">
              {voterDetails?.candidates?.map((candidate: any) => (
                <div
                  key={candidate.id}
                  className={`p-6 rounded-lg cursor-pointer transition-all duration-300 ${
                    selectedCandidate === candidate.id
                      ? 'bg-blue-500/20 border-2 border-blue-500'
                      : 'bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600'
                  }`}
                  onClick={() => !voteSubmitted && setSelectedCandidate(candidate.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 relative rounded-full overflow-hidden bg-gray-600">
                        {candidate.image && (
                          <Image
                            src={candidate.image}
                            alt={candidate.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium text-lg">{candidate.name}</p>
                        <p className="text-gray-400">{candidate.party}</p>
                      </div>
                    </div>
                    <div className="text-gray-300">
                      {candidate.symbol}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleVote}
              disabled={!selectedCandidate || voteSubmitted}
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
                selectedCandidate && !voteSubmitted
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {voteSubmitted ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting Vote...
                </span>
              ) : (
                'Submit Vote'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyFace } from "@/lib/faceutils";

export default function VotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const otu = searchParams?.get("otu");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voterDetails, setVoterDetails] = useState<any>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  useEffect(() => {
    const verifyAndLoadVoter = async () => {
      try {
        if (!otu) {
          throw new Error("Invalid or missing verification token");
        }

        // Fetch voter details first
        const response = await fetch(`/api/fetch-voter?otu=${encodeURIComponent(otu)}`);
        if (!response.ok) {
          throw new Error("Failed to fetch voter details");
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
        const verificationResult = await verifyFace(data.aadhaar, data.voter_id, float32Descriptor);
        
        if (!verificationResult.isMatch) {
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your identity...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Verification Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/face-capture')}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Cast Your Vote</h1>
          
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Voter Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{voterDetails?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Voter ID</p>
                <p className="font-medium">{voterDetails?.voter_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Constituency</p>
                <p className="font-medium">{voterDetails?.constituency}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Verification Status</p>
                <p className="font-medium text-green-600">Verified</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Select Candidate</h2>
            <div className="space-y-4">
              {voterDetails?.candidates?.map((candidate: any) => (
                <div
                  key={candidate.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedCandidate === candidate.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedCandidate(candidate.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{candidate.name}</p>
                      <p className="text-sm text-gray-500">{candidate.party}</p>
                    </div>
                    <div className="text-sm text-gray-500">
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
              disabled={!selectedCandidate}
              className={`px-6 py-2 rounded-md text-white font-medium ${
                selectedCandidate
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-400 cursor-not-allowed'
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
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Voter = {
  name: string;
  aadhaar: string;
  voter_id: string;
  phone: string;
  address: string;
  gender: string;
  dob: string;
  photo: string;
  otu: string;
};

export default function VoterDetailsPage() {
  const searchParams = useSearchParams();
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

  if (!voter) return <p className="text-center mt-20">Loading voter details...</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white shadow-lg rounded-xl p-6 text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">Voter Details</h1>

      <div className="flex flex-col items-center mb-6">
        {voter.photo && (
          <img
            src={`data:image/jpeg;base64,${voter.photo}`}
            alt="Voter Photo"
            className="w-32 h-32 rounded-full object-cover border-4 border-blue-500"
          />
        )}
      </div>

      <div className="space-y-2 text-lg">
        <p><strong>Name:</strong> {voter.name}</p>
        <p><strong>Aadhaar:</strong> {voter.aadhaar}</p>
        <p><strong>Voter ID:</strong> {voter.voter_id}</p>
        <p><strong>Phone:</strong> +91-{voter.phone}</p>
        <p><strong>Gender:</strong> {voter.gender}</p>
        <p><strong>Date of Birth:</strong> {voter.dob}</p>
        <p><strong>Address:</strong> {voter.address}</p>
        <p><strong>One-Time Passkey:</strong> <code className="text-blue-600 break-words">{voter.otu}</code></p>
      </div>

      <div className="mt-6 text-center">
        <a
          href={`/vote?otu=${voter.otu}`}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
        >
          Proceed to Vote
        </a>
      </div>
    </div>
  );
}

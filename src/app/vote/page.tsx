//app/vote/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

// Loading spinner
function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-300">{message}</p>
      </div>
    </div>
  );
}

// Error screen
function ErrorScreen({ message, retryPath }: { message: string; retryPath: string }) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
        <p className="text-gray-300 mb-6">{message}</p>
        <button onClick={() => router.push(retryPath)} className="w-full bg-blue-600 text-white py-3 rounded-lg">
          Try Again
        </button>
      </div>
    </div>
  );
}

export default function VotePage() {
  const router = useRouter();
  const otu = useSearchParams()?.get("otu");
  const [isLoading,setIsLoading] = useState(true);
  const [error,setError] = useState<string|null>(null);
  const [voter, setVoter] = useState<any>(null);
  const [selected,setSelected] = useState<string|null>(null);

  useEffect(() => {
    (async()=>{
      try {
        if (!otu) throw new Error("Invalid token.");
        const r = await fetch(`/api/fetch-voter?otu=${encodeURIComponent(otu)}`);
        if (!r.ok) { const e=await r.json(); throw new Error(e.error||"Fetch voter failed"); }
        const { voter: v } = await r.json();
        setVoter(v);
        const sd = sessionStorage.getItem("faceDescriptor");
        const lv = sessionStorage.getItem("lastVerification");
        if (!sd||!lv) throw new Error("Missing face verification.");
        if (Date.now()-parseInt(lv)>5*60*1000) throw new Error("Verification expired.");
        setIsLoading(false);
      } catch(e:any) {
        console.error(e);
        setError(e.message);
        setIsLoading(false);
      }
    })();
  },[otu]);

  const handleVote = async() => {
    if(!selected){setError("Select candidate");return;}
    try{
      const r = await fetch('/api/submit-vote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({otu,candidateId:selected,voterId:voter.voter_id})});
      if(!r.ok) throw new Error("Submit failed");
      sessionStorage.removeItem('faceDescriptor');
      sessionStorage.removeItem('lastVerification');
      router.push('/vote-success');
    }catch(e:any){console.error(e);setError(e.message||"Vote failed");}
  };

  if(isLoading) return <LoadingSpinner message="Loading voter info..."/>;
  if(error) return <ErrorScreen message={error} retryPath="/face-capture"/>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-4">
      {/* Render voter.name, voter.voter_id, etc. */}
      {/* Map through candidates and onClick setSelected() */}
      <button disabled={!selected} onClick={handleVote} className={`px-8 py-3 rounded-lg text-white ${selected? 'bg-green-600':'bg-gray-600'}`}>Submit Vote</button>
    </main>
  );
}
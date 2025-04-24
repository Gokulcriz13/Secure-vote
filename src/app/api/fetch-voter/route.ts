// src/app/api/fetch-voter/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/mysql';

interface Voter {
  name: string;
  voter_id: string;
  aadhaar: string;
  constituency_id: number;
  phone: string;
  address: string;
  gender: string;
  dob: string;
  photo: Buffer;
  otu?: string;
  otu_expires_at?: Date;
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}

async function handleRequest(request: Request) {
  try {
    console.log("🛬 Incoming request:", request.method, request.url);

    let otu: string | null = null;
    let aadhaar: string | null = null;
    let voterId: string | null = null;

    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      otu = searchParams.get('otu');
      console.log("🟦 Extracted from GET params:", { otu });
    } else {
      const body = await request.json();
      otu = body.otu;
      aadhaar = body.aadhaar;
      voterId = body.voterId;
      console.log("📦 Extracted from POST body:", { otu, aadhaar, voterId });
    }

    if (!otu && (!aadhaar || !voterId)) {
      console.warn("⚠️ Missing OTU or Aadhaar/Voter ID");
      return NextResponse.json(
        { error: 'Either OTU or both Aadhaar and Voter ID are required' },
        { status: 400 }
      );
    }

    // Build query
    let query = '';
    let params: any[] = [];

    if (otu) {
      query = `SELECT * FROM voters WHERE otu = ? AND otu_expires_at > NOW()`;
      params = [otu];
    } else {
      query = `SELECT * FROM voters WHERE aadhaar = ? AND voter_id = ?`;
      params = [aadhaar, voterId];
    }

    console.log("📡 Executing SQL query:", query);
    console.log("📨 With params:", params);

    const [rows] = await db.query(query, params) as [Voter[], any];
    console.log("🧾 Query result rows:", rows);

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      console.warn("❌ No voter found or OTU expired.");
      return NextResponse.json(
        { error: 'Invalid credentials or expired OTU' },
        { status: 404 }
      );
    }

    const voter = rows[0];

    const photoBase64 = voter.photo ? voter.photo.toString('base64') : null;

    console.log("✅ Voter found:", {
      name: voter.name,
      voter_id: voter.voter_id,
      aadhaar: voter.aadhaar,
      otu: voter.otu ? "present" : "missing"
    });

    return NextResponse.json({
      success: true,
      voter: {
        name: voter.name,
        voter_id: voter.voter_id,
        aadhaar: voter.aadhaar,
        phone: voter.phone,
        address: voter.address,
        gender: voter.gender,
        dob: voter.dob,
        photo: photoBase64,
        otu: voter.otu,
        constituency: "Your Constituency"
      }
    });
  } catch (error) {
    console.error("❌ Error fetching voter details:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
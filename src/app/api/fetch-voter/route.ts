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
  hashed_otu?: string;
  otu_expires_at?: Date;
}

interface Candidate {
  id: number;
  name: string;
  party: string;
  symbol: string;
  image: string;
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}

async function handleRequest(request: Request) {
  try {
    let otu: string | null = null;
    let aadhaar: string | null = null;
    let voterId: string | null = null;
    
    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      otu = searchParams.get('otu');
    } else {
      const body = await request.json();
      otu = body.otu;
      aadhaar = body.aadhaar;
      voterId = body.voterId;
    }

    if (!otu && (!aadhaar || !voterId)) {
      return NextResponse.json(
        { error: 'Either OTU or both Aadhaar and Voter ID are required' },
        { status: 400 }
      );
    }

    // Fetch voter details
    let query = '';
    let params: any[] = [];

    if (otu) {
      query = `SELECT * FROM voters WHERE otu = ? AND otu_expires_at > NOW()`;
      params = [otu];
    } else {
      query = `SELECT * FROM voters WHERE aadhaar = ? AND voter_id = ?`;
      params = [aadhaar, voterId];
    }

    const [rows] = await db.query(query, params) as [Voter[], any];

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials or expired OTU' },
        { status: 404 }
      );
    }

    const voter = rows[0];
    
    // Convert photo Buffer to base64 string if it exists
    const photoBase64 = voter.photo ? voter.photo.toString('base64') : null;

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
        hashed_otu: voter.hashed_otu,
        constituency: "Your Constituency" // Placeholder until constituencies table is created
      }
    });
  } catch (error) {
    console.error('Error fetching voter details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voter details' },
      { status: 500 }
    );
  }
} 
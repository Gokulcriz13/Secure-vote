import { NextResponse } from 'next/server';
import { db } from '@/lib/mysql';

export async function POST(request: Request) {
  try {
    const { aadhaar, voterId, otu } = await request.json();

    if (!aadhaar || !voterId || !otu) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update the voter record with the OTU
    const query = `
      UPDATE voters 
      SET otu = ?, 
          otu_expires_at = DATE_ADD(NOW(), INTERVAL 1 HOUR),
          otu_created_at = NOW()
      WHERE aadhaar = ? AND voter_id = ?
    `;

    await db.query(query, [otu, aadhaar, voterId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing OTU:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 
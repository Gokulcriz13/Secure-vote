//src/app/api/process-faces/route.ts
import { NextResponse } from 'next/server';
import { loadServerModels, processVoterPhoto } from '@/lib/server/face-processing';
import { db } from '@/lib/mysql';

export async function POST(req: Request) {
  try {
    const { aadhaar, voterId } = await req.json();

    if (!aadhaar || !voterId) {
      return NextResponse.json({ error: 'aadhaar and voterId are required' }, { status: 400 });
    }

    console.log('Loading face models...');
    await loadServerModels();
    console.log('Face models loaded successfully.');

    // Fetch specific voter
    const [rows] = await db.query<any[]>(
      'SELECT aadhaar, voter_id, photo FROM voters WHERE aadhaar = ? AND voter_id = ? AND photo IS NOT NULL',
      [aadhaar, voterId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Voter not found or photo missing' }, { status: 404 });
    }

    const { photo } = rows[0];
    console.log(`Processing voter: Aadhaar=${aadhaar}, VoterID=${voterId}`);

    const result = await processVoterPhoto({ aadhaar, voter_id: voterId, photo });

    if (result && result.success) {
      console.log(`Descriptor inserted for ${aadhaar}/${voterId}`);
    } else {
      console.warn(`Face not detected or insert failed for ${aadhaar}/${voterId}`);
    }

    // Optional: Confirm that descriptor was inserted
    const [descriptorRows] = await db.query<any[]>(
      'SELECT * FROM face_descriptors WHERE aadhaar = ? AND voter_id = ? AND verification_status = ?',
      [aadhaar, voterId, 'verified']
    );

    const verified = descriptorRows.length > 0;

    return NextResponse.json({
      message: 'Voter photo processed',
      aadhaar,
      voterId,
      verified,
    });
  } catch (error) {
    console.error('Error in /api/process-faces:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
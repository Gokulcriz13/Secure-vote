import { NextResponse } from 'next/server';
import { db } from '@/lib/mysql';
import { processVoterPhoto, loadServerModels } from '@/lib/server/face-processing';

export async function POST() {
  try {
    // Load models
    await loadServerModels();

    // Get all voters with photos
    const [voters] = await db.query<any[]>(
      'SELECT aadhaar, voter_id, photo FROM voters WHERE photo IS NOT NULL'
    );

    if (!voters || !Array.isArray(voters)) {
      return NextResponse.json(
        { error: 'No voters found' },
        { status: 404 }
      );
    }

    // Process each voter
    let successful = 0;
    let failed = 0;

    for (const voter of voters) {
      const success = await processVoterPhoto(voter);
      if (success) successful++;
      else failed++;
    }

    return NextResponse.json({
      success: true,
      processed: {
        successful,
        failed,
        total: voters.length
      }
    });
  } catch (error) {
    console.error('Error processing faces:', error);
    return NextResponse.json(
      { error: 'Failed to process faces' },
      { status: 500 }
    );
  }
} 
// src/app/api/process-faces/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/mysql';
import { processVoterPhoto, loadServerModels } from '@/lib/server/face-processing';

export async function POST() {
try {
// Load models (fail early if error)
try {
await loadServerModels();
console.log('Server models loaded');
} catch (err) {
console.error('Model load failed:', err);
return NextResponse.json({ error: 'Model load failed' }, { status: 500 });
}

// Get all voters with photos
const [voters] = await db.query<any[]>(
  'SELECT aadhaar, voter_id, photo FROM voters WHERE photo IS NOT NULL'
);
console.log(`Found ${voters.length} voters with photos`);

if (!Array.isArray(voters) || voters.length === 0) {
  return NextResponse.json({ error: 'No voters found' }, { status: 404 });
}

// Process each voter
let successful = 0;
let failed = 0;

for (const voter of voters) {
  console.log('Processing', voter.aadhaar);
  const success = await processVoterPhoto(voter);
  if (success) successful++;
  else {
    console.warn('Failed processing', voter.aadhaar);
    failed++;
  }
}

return NextResponse.json({
  success: true,
  processed: { successful, failed, total: voters.length }
});
} catch (error) {
  console.error('Error processing faces:', error);
  return NextResponse.json({ error: 'Failed to process faces' }, { status: 500 });
  }
  }
  
  
// src/app/api/fetch-descriptor/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/mysql';
import { RowDataPacket } from 'mysql2';

interface VoterRow extends RowDataPacket { aadhaar: string; voter_id: string }
interface DescRow extends RowDataPacket { descriptor_data: string | number[] }

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const otu = searchParams.get('otu');
  if (!otu) {
    return NextResponse.json({ error: 'Missing otu' }, { status: 400 });
  }

  // lookup voter by OTU & expiry
  const [vRows] = await db.query<VoterRow[]>(
    'SELECT aadhaar, voter_id FROM voters WHERE otu = ? AND otu_expires_at > NOW()',
    [otu]
  );
  if (!vRows.length) {
    return NextResponse.json({ error: 'Invalid/expired token' }, { status: 404 });
  }
  const { aadhaar, voter_id } = vRows[0];

  // ✅ FIXED: Added space between table name and WHERE
  const [dRows] = await db.query<DescRow[]>(
    'SELECT descriptor_data FROM face_descriptors WHERE aadhaar = ? AND voter_id = ? LIMIT 1',
    [aadhaar, voter_id]
  );

  if (!dRows.length || !dRows[0].descriptor_data) {
    return NextResponse.json({ error: 'Descriptor not found' }, { status: 404 });
  }

  const raw = dRows[0].descriptor_data;
  let descriptor: number[];
  if (typeof raw === 'string') {
    descriptor = JSON.parse(raw);
  } else {
    descriptor = raw as number[];
  }

  if (!Array.isArray(descriptor) || descriptor.length !== 128) {
    return NextResponse.json({ error: 'Invalid descriptor length' }, { status: 500 });
  }

  return NextResponse.json({ descriptor });
}

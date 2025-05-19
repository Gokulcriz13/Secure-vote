//src/app/api/fetch-descriptor/route.ts
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

  try {
    // lookup voter by OTU & expiry
    const [vRows] = await db.query<VoterRow[]>(
      'SELECT aadhaar, voter_id FROM voters WHERE otu = ? AND otu_expires_at > NOW()',
      [otu]
    );
    if (!vRows.length) {
      return NextResponse.json({ error: 'Invalid/expired token' }, { status: 404 });
    }
    const { aadhaar, voter_id } = vRows[0];

    console.log(`Fetching descriptor for ${aadhaar}/${voter_id}`);

    // Get descriptor with proper spacing and parameter binding
    const [dRows] = await db.query<DescRow[]>(
      'SELECT descriptor_data FROM face_descriptors WHERE aadhaar = ? AND voter_id = ? LIMIT 1',
      [aadhaar, voter_id]
    );

    if (!dRows.length) {
      console.error('No descriptor row found');
      return NextResponse.json({ error: 'Descriptor not found' }, { status: 404 });
    }
    
    if (!dRows[0].descriptor_data) {
      console.error('Descriptor is NULL');
      return NextResponse.json({ error: 'Descriptor is NULL' }, { status: 404 });
    }

    const raw = dRows[0].descriptor_data;
    console.log('Raw descriptor type:', typeof raw);
    
    let descriptor: number[];
    if (typeof raw === 'string') {
      try {
        descriptor = JSON.parse(raw);
        console.log('Parsed string descriptor');
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr);
        return NextResponse.json({ error: 'Invalid descriptor format' }, { status: 500 });
      }
    } else if (typeof raw === 'object') {
      descriptor = raw as number[];
      console.log('Using object descriptor');
    } else {
      console.error('Unexpected descriptor type:', typeof raw);
      return NextResponse.json({ error: 'Invalid descriptor type' }, { status: 500 });
    }

    if (!Array.isArray(descriptor) || descriptor.length !== 128) {
      console.error('Invalid descriptor structure:', Array.isArray(descriptor), descriptor.length);
      return NextResponse.json({ 
        error: `Invalid descriptor length: ${Array.isArray(descriptor) ? descriptor.length : 'not an array'}`
      }, { status: 500 });
    }

    return NextResponse.json({ descriptor });
  } catch (error) {
    console.error('Fetch descriptor error:', error);
    return NextResponse.json({ error: 'Failed to fetch descriptor', details: String(error) }, { status: 500 });
  }
}

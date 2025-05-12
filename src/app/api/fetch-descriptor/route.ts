import { NextResponse } from 'next/server';
import { db } from '@/lib/mysql';
import { RowDataPacket } from 'mysql2';

interface VoterRow extends RowDataPacket {
  face_descriptor: number[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const otu = searchParams.get('otu');

  if (!otu) {
    return NextResponse.json({ error: 'Missing otu parameter' }, { status: 400 });
  }

  try {
    const [rows] = await db.query<VoterRow[]>(
      'SELECT face_descriptor FROM voters WHERE otu = ?',
      [otu]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Descriptor not found' }, { status: 404 });
    }

    return NextResponse.json({ descriptor: rows[0].face_descriptor });
  } catch (error) {
    console.error('Error fetching descriptor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
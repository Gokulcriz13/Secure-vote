import { NextResponse } from 'next/server';
import { db } from '@/lib/mysql';

export async function GET() {
  try {
    const [rows] = await db.query('SHOW COLUMNS FROM voters');
    return NextResponse.json({ success: true, schema: rows });
  } catch (error) {
    console.error('Error checking schema:', error);
    return NextResponse.json({ error: 'Failed to check schema' }, { status: 500 });
  }
} 
import { db } from '@/lib/mysql';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { aadhaar, voterId } = req.body;

  try {
    const [rows]: any = await db.query(
      'SELECT * FROM voters WHERE aadhaar = ? AND voter_id = ?',
      [aadhaar, voterId]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });

    res.status(200).json({ success: true, user: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
}
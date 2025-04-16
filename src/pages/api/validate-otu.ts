// pages/api/validate-otu.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { otu } = req.body;
  if (!otu) return res.status(400).json({ success: false, error: 'Missing OTU' });

  try {
    const [rows]: any = await db.query(
      'SELECT * FROM voters WHERE otu = ? AND TIMESTAMPDIFF(MINUTE, created_at, NOW()) < 10',
      [otu]
    );

    if (rows.length === 0) return res.status(403).json({ success: false, error: 'Invalid or expired OTU' });

    // Invalidate the OTU immediately
    await db.query('UPDATE voters SET otu = NULL WHERE otu = ?', [otu]);

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Database error' });
  }
}

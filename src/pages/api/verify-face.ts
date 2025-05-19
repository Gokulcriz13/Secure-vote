//src/pages/api/verify-face.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyFace } from '@/lib/server/face-processing';
import { FaceVerificationPayload } from '@/types/FaceVerification';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const payload: FaceVerificationPayload = req.body;
  try {
    const result = await verifyFace(payload);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
}
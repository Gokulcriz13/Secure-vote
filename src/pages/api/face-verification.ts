import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { aadhaar, voterId, faceDescriptor, mode } = req.body;

    if (!aadhaar || !voterId || !faceDescriptor) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    if (mode === 'store') {
      try {
        const [result] = await db.query(
          'UPDATE voters SET face_descriptor = ? WHERE aadhaar = ? AND voter_id = ?',
          [JSON.stringify(Array.from(faceDescriptor)), aadhaar, voterId]
        );

        return res.status(200).json({
          success: true,
          message: 'Face descriptor stored successfully'
        });
      } catch (error: any) {
        if (error.code === 'ER_BAD_FIELD_ERROR') {
          await db.query('ALTER TABLE voters ADD COLUMN IF NOT EXISTS face_descriptor JSON DEFAULT NULL');
          await db.query(
            'UPDATE voters SET face_descriptor = ? WHERE aadhaar = ? AND voter_id = ?',
            [JSON.stringify(Array.from(faceDescriptor)), aadhaar, voterId]
          );
          return res.status(200).json({ success: true, message: 'Face descriptor stored successfully' });
        }
        throw error;
      }
    }

    if (mode === 'verify') {
      const [rows] = await db.query(
        'SELECT face_descriptor FROM voters WHERE aadhaar = ? AND voter_id = ?',
        [aadhaar, voterId]
      );

      if (!rows || !Array.isArray(rows) || rows.length === 0) {
        return res.status(404).json({ success: false, message: 'No face descriptor found for voter' });
      }

      let storedDescriptor;
      try {
        const raw = (rows[0] as any).face_descriptor;
        storedDescriptor = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!Array.isArray(storedDescriptor)) throw new Error();
      } catch {
        return res.status(400).json({
          success: false,
          message: 'Corrupted face descriptor data',
        });
      }

      const distance = calculateDescriptorDistance(faceDescriptor, storedDescriptor);
      const match = distance < 0.6;

      return res.status(200).json({
        success: true,
        match,
        distance,
        message: match ? 'Face verification successful' : 'Face verification failed'
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid mode specified' });
  } catch (error) {
    console.error('Error in face verification:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

function calculateDescriptorDistance(descriptor1: number[], descriptor2: number[]): number {
  if (descriptor1.length !== descriptor2.length) {
    throw new Error('Descriptor lengths do not match');
  }

  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

//src/pages/api/face-verification.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';
import { calculateDescriptorDistance, compareDescriptors } from '@/lib/faceutils';
import { RowDataPacket } from 'mysql2';

interface DescriptorRow extends RowDataPacket {
  descriptor_data: string | number[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { mode, aadhaar, voterId, faceDescriptor } = req.body;

  // Check for missing parameters
  if (!mode || !aadhaar || !voterId || !faceDescriptor) {
    return res.status(400).json({ success: false, message: 'Missing parameters' });
  }

  // Handle store mode
  if (mode === 'store') {
    try {
      // Ensure the faceDescriptor is an array of 128 numbers
      if (!Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
        return res.status(400).json({ success: false, message: 'Invalid descriptor length' });
      }

      // Insert or update the face descriptor for the voter
      await db.query(
        `INSERT INTO face_descriptors
          (aadhaar, voter_id, descriptor_data, verification_status)
        VALUES (?, ?, ?, 'verified')
        ON DUPLICATE KEY UPDATE
          descriptor_data = VALUES(descriptor_data),
          verification_status = 'verified'`,
        [aadhaar, voterId, JSON.stringify(faceDescriptor)]
      );

      return res.status(200).json({ success: true, message: 'Descriptor stored' });
    } catch (error) {
      console.error('Error storing descriptor:', error);
      return res.status(500).json({ success: false, message: 'Failed to store descriptor' });
    }
  }

  // Handle verify mode
  if (mode === 'verify') {
    try {
      // Fetch the stored descriptor from the database
      const [rows] = await db.query<DescriptorRow[]>(
        'SELECT descriptor_data FROM face_descriptors WHERE aadhaar = ? AND voter_id = ?',
        [aadhaar, voterId]
      );

      if (!rows || rows.length === 0) {
        return res.status(404).json({ success: false, message: 'No descriptor found' });
      }

      let stored: number[];

      // Parse the stored descriptor data
      try {
        const raw = rows[0].descriptor_data;
        stored = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Corrupted descriptor' });
      }

      // Compare the provided face descriptor with the stored one
      const { distance, match } = compareDescriptors(faceDescriptor, stored);

      return res.status(200).json({ success: true, match, distance });
    } catch (error) {
      console.error('Error verifying descriptor:', error);
      return res.status(500).json({ success: false, message: 'Failed to verify descriptor' });
    }
  }

  // Invalid mode
  return res.status(400).json({ success: false, message: 'Invalid mode' });
}

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
    console.warn('Missing params:', { mode, aadhaar, voterId, faceDescriptorLength: Array.isArray(faceDescriptor) ? faceDescriptor.length : 'invalid' });
    return res.status(400).json({ success: false, message: 'Missing parameters' });
  }

  // Handle store mode
  if (mode === 'store') {
    try {
      // Ensure the faceDescriptor is an array of 128 numbers
      if (!Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid descriptor length: ${Array.isArray(faceDescriptor) ? faceDescriptor.length : 'not an array'}` 
        });
      }

      console.log(`Storing descriptor for ${aadhaar}/${voterId}`);
      console.log('First few values:', faceDescriptor.slice(0, 5));
      
      // Serialize descriptor with JSON.stringify
      const descriptorJson = JSON.stringify(faceDescriptor);
      
      // Insert or update the face descriptor for the voter
      const result = await db.query(
        `INSERT INTO face_descriptors
          (aadhaar, voter_id, descriptor_data, verification_status)
        VALUES (?, ?, ?, 'verified')
        ON DUPLICATE KEY UPDATE
          descriptor_data = VALUES(descriptor_data),
          verification_status = 'verified'`,
        [aadhaar, voterId, descriptorJson]
      );

      console.log('Store result:', result);
      
      // Verify the descriptor was stored correctly
      const [checkRows] = await db.query<DescriptorRow[]>(
        'SELECT descriptor_data FROM face_descriptors WHERE aadhaar = ? AND voter_id = ?',
        [aadhaar, voterId]
      );
      
      if (!Array.isArray(checkRows) || checkRows.length === 0 || !checkRows[0].descriptor_data) {
        console.error('Storage verification failed - descriptor still null');
        return res.status(500).json({ success: false, message: 'Descriptor storage verification failed' });
      }
      
      console.log('Storage verification passed');
      return res.status(200).json({ success: true, message: 'Descriptor stored' });
    } catch (error) {
      console.error('Error storing descriptor:', error);
      return res.status(500).json({ success: false, message: `Failed to store descriptor: ${error}` });
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

      if (!rows[0].descriptor_data) {
        return res.status(404).json({ success: false, message: 'Descriptor is NULL' });
      }

      let stored: number[];

      // Parse the stored descriptor data
      try {
        const raw = rows[0].descriptor_data;
        stored = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (err) {
        return res.status(500).json({ success: false, message: `Corrupted descriptor: ${err}` });
      }

      if (!Array.isArray(stored) || stored.length !== 128) {
        return res.status(500).json({ 
          success: false, 
          message: `Invalid stored descriptor: ${Array.isArray(stored) ? stored.length : 'not an array'}` 
        });
      }

      // Compare the provided face descriptor with the stored one
      const { distance, match } = compareDescriptors(faceDescriptor, stored);

      return res.status(200).json({ success: true, match, distance });
    } catch (error) {
      console.error('Error verifying descriptor:', error);
      return res.status(500).json({ success: false, message: `Failed to verify descriptor: ${error}` });
    }
  }

  // Invalid mode
  return res.status(400).json({ success: false, message: 'Invalid mode' });
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';

const MAX_VERIFICATION_ATTEMPTS = 3;
const VERIFICATION_COOLDOWN_MINUTES = 5;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { aadhaar, voterId, faceDescriptor, mode } = req.body;

  if (!aadhaar || !voterId || !faceDescriptor) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  try {
    // First verify if the voter exists and is eligible
    const [voters]: any = await db.query(
      'SELECT * FROM voters WHERE aadhaar = ? AND voter_id = ?',
      [aadhaar, voterId]
    );

    if (voters.length === 0) {
      return res.status(404).json({ success: false, message: 'Voter not found' });
    }

    if (mode === 'store') {
      // Check if descriptor already exists
      const [existing]: any = await db.query(
        'SELECT * FROM face_descriptors WHERE aadhaar = ? AND voter_id = ?',
        [aadhaar, voterId]
      );

      if (existing.length > 0) {
        // Update existing descriptor
        await db.query(
          `UPDATE face_descriptors 
           SET descriptor_data = ?, 
               verification_status = 'pending',
               verification_attempts = 0
           WHERE aadhaar = ? AND voter_id = ?`,
          [JSON.stringify(faceDescriptor), aadhaar, voterId]
        );
      } else {
        // Store new descriptor
        await db.query(
          `INSERT INTO face_descriptors 
           (aadhaar, voter_id, descriptor_data) 
           VALUES (?, ?, ?)`,
          [aadhaar, voterId, JSON.stringify(faceDescriptor)]
        );
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Face descriptor stored successfully' 
      });

    } else if (mode === 'verify') {
      // Check verification attempts and cooldown
      const [descriptors]: any = await db.query(
        `SELECT * FROM face_descriptors 
         WHERE aadhaar = ? AND voter_id = ?
         AND (
           verification_attempts < ? OR 
           last_verification_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)
         )`,
        [aadhaar, voterId, MAX_VERIFICATION_ATTEMPTS, VERIFICATION_COOLDOWN_MINUTES]
      );

      if (descriptors.length === 0) {
        return res.status(429).json({ 
          success: false, 
          message: `Too many verification attempts. Please try again after ${VERIFICATION_COOLDOWN_MINUTES} minutes.` 
        });
      }

      const storedDescriptor = JSON.parse(descriptors[0].descriptor_data);
      
      // Convert descriptor arrays to Float32Array for comparison
      const stored = new Float32Array(storedDescriptor);
      const current = new Float32Array(faceDescriptor);

      // Calculate Euclidean distance between descriptors
      let distance = 0;
      for (let i = 0; i < stored.length; i++) {
        distance += Math.pow(stored[i] - current[i], 2);
      }
      distance = Math.sqrt(distance);

      // Threshold for face similarity (adjust as needed)
      const SIMILARITY_THRESHOLD = 0.6;
      const isMatch = distance < SIMILARITY_THRESHOLD;

      // Update verification status and attempts
      await db.query(
        `UPDATE face_descriptors 
         SET verification_attempts = verification_attempts + 1,
             last_verification_at = NOW(),
             verification_status = ?
         WHERE aadhaar = ? AND voter_id = ?`,
        [isMatch ? 'verified' : 'failed', aadhaar, voterId]
      );

      return res.status(200).json({
        success: true,
        isMatch,
        confidence: 1 - distance,
        message: isMatch ? 'Face verification successful' : 'Face verification failed'
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid mode' });
    }
  } catch (error) {
    console.error('Face verification error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
} 
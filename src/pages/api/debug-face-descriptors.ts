import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';
import { RowDataPacket } from 'mysql2';

interface DescriptorInfo extends RowDataPacket {
  id: number;
  aadhaar: string;
  voter_id: string;
  verification_status: string;
  descriptor_status: string;
  is_valid_json: number;
  descriptor_length: number;
  created_at: Date;
  updated_at: Date;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { aadhaar, voterId } = req.query;
  
  // Require authentication parameters for security
  if (!aadhaar || !voterId) {
    return res.status(400).json({ success: false, message: 'Missing parameters' });
  }

  try {
    // Check if descriptor exists
    const [rowsResult] = await db.query<DescriptorInfo[]>(
      `SELECT 
         id,
         aadhaar, 
         voter_id, 
         verification_status,
         CASE 
           WHEN descriptor_data IS NULL THEN 'NULL' 
           ELSE 'NOT NULL' 
         END AS descriptor_status,
         CASE 
           WHEN descriptor_data IS NOT NULL THEN JSON_VALID(descriptor_data) 
           ELSE false 
         END AS is_valid_json,
         CASE 
           WHEN descriptor_data IS NOT NULL AND JSON_VALID(descriptor_data) = 1 
           THEN JSON_LENGTH(descriptor_data) 
           ELSE 0 
         END AS descriptor_length,
         created_at,
         updated_at
       FROM face_descriptors 
       WHERE aadhaar = ? AND voter_id = ?`,
      [aadhaar, voterId]
    );

    // Ensure rows is an array
    const rows = Array.isArray(rowsResult) ? rowsResult : [];

    if (rows.length === 0) {
      // Check if voter exists at all
      const [voterRowsResult] = await db.query<RowDataPacket[]>(
        'SELECT aadhaar, voter_id FROM voters WHERE aadhaar = ? AND voter_id = ?',
        [aadhaar, voterId]
      );
      
      // Ensure voterRows is an array
      const voterRows = Array.isArray(voterRowsResult) ? voterRowsResult : [];
      
      if (voterRows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Voter not found',
          voterExists: false,
          descriptorExists: false
        });
      }
      
      return res.status(404).json({ 
        success: false, 
        message: 'No face descriptor found for this voter',
        voterExists: true,
        descriptorExists: false
      });
    }

    return res.status(200).json({ 
      success: true, 
      descriptor_info: rows[0]
    });
  } catch (error) {
    console.error('Error debugging face descriptors:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to debug face descriptors', 
      error: String(error)
    });
  }
}

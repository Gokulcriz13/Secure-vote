import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';
import { RowDataPacket } from 'mysql2';

interface DescriptorRow extends RowDataPacket {
  descriptor_data: string | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { aadhaar, voterId } = req.body;
  
  if (!aadhaar || !voterId) {
    return res.status(400).json({ success: false, message: 'Missing parameters' });
  }

  try {
    // Generate a fake descriptor - just for testing
    const fakeDescriptor = Array(128).fill(0).map(() => Math.random() - 0.5);
    const descriptorJson = JSON.stringify(fakeDescriptor);
    
    // Insert test descriptor
    await db.query(
      `INSERT INTO face_descriptors
        (aadhaar, voter_id, descriptor_data, verification_status)
      VALUES (?, ?, ?, 'verified')
      ON DUPLICATE KEY UPDATE
        descriptor_data = VALUES(descriptor_data),
        verification_status = 'verified'`,
      [aadhaar, voterId, descriptorJson]
    );
    
    // Verify insertion
    const [rowsResult] = await db.query<DescriptorRow[]>(
      'SELECT descriptor_data FROM face_descriptors WHERE aadhaar = ? AND voter_id = ?',
      [aadhaar, voterId]
    );
    
    // Ensure rows is an array
    const rows = Array.isArray(rowsResult) ? rowsResult : [];
    
    if (rows.length === 0 || !rows[0].descriptor_data) {
      return res.status(500).json({ 
        success: false, 
        message: 'Test descriptor insertion verification failed'
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Test descriptor inserted successfully'
    });
  } catch (error) {
    console.error('Error inserting test descriptor:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to insert test descriptor', 
      error: String(error)
    });
  }
}

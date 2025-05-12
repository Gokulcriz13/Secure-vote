import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';
import { calculateDescriptorDistance } from '@/lib/faceutils';
import { RowDataPacket } from 'mysql2';

interface DescriptorRow extends RowDataPacket {
  descriptor_data: number[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { mode, aadhaar, voterId, faceDescriptor } = req.body;
  if (!mode || !aadhaar || !voterId || !faceDescriptor) {
    return res.status(400).json({ success: false, message: 'Missing parameters' });
  }

  if (mode === 'store') {
    await db.query(
      `INSERT INTO face_descriptors
         (aadhaar, voter_id, descriptor_data, verification_status)
       VALUES (?, ?, ?, 'verified')
       ON DUPLICATE KEY UPDATE
         descriptor_data = VALUES(descriptor_data),
         verification_status = 'verified'
      `,
      [aadhaar, voterId, JSON.stringify(faceDescriptor)]
    );
    return res.status(200).json({ success: true, message: 'Descriptor stored' });
  }

  if (mode === 'verify') {
    const [rows] = await db.query<DescriptorRow[]>(
      'SELECT descriptor_data FROM face_descriptors WHERE aadhaar = ? AND voter_id = ?',
      [aadhaar, voterId]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No descriptor found' });
    }

    const stored = rows[0].descriptor_data;
    const distance = calculateDescriptorDistance(faceDescriptor, stored);
    const match = distance < 0.6;

    return res.status(200).json({ success: true, match, distance });
  }

  return res.status(400).json({ success: false, message: 'Invalid mode' });
}
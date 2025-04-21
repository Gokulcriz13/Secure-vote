import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/mysql';
import formidable, { File } from 'formidable';
import fs from 'fs';
import path from 'path';

// Configure formidable to parse files
export const config = {
  api: {
    bodyParser: false,
  },
};

// Image specifications for face-api.js
const IMAGE_SPECS = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png'],
  minWidth: 224, // Minimum width required by face-api.js
  minHeight: 224, // Minimum height required by face-api.js
  maxWidth: 4096, // Reasonable maximum
  maxHeight: 4096,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: IMAGE_SPECS.maxSize,
      filter: ({ mimetype }: { mimetype: string | null }) => {
        return mimetype ? IMAGE_SPECS.allowedTypes.includes(mimetype) : false;
      },
    });

    // Parse the form data
    const [fields, files] = await form.parse(req);
    const aadhaar = fields.aadhaar?.[0];
    const voterId = fields.voterId?.[0];
    const photo = files.photo?.[0];

    if (!aadhaar || !voterId || !photo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        requirements: {
          fields: ['aadhaar', 'voterId', 'photo'],
          imageSpecs: IMAGE_SPECS,
        },
      });
    }

    // Verify voter exists
    const [voters]: any = await db.query(
      'SELECT * FROM voters WHERE aadhaar = ? AND voter_id = ?',
      [aadhaar, voterId]
    );

    if (voters.length === 0) {
      return res.status(404).json({ success: false, message: 'Voter not found' });
    }

    // Read and validate the image file
    const imageBuffer = fs.readFileSync(photo.filepath);

    // Store the image temporarily for face-api.js processing
    const tempDir = path.join(process.cwd(), 'public', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `${aadhaar}_${Date.now()}.jpg`);
    fs.writeFileSync(tempFilePath, imageBuffer);

    // Store the image path in the database for processing
    await db.query(
      `INSERT INTO face_descriptors 
       (aadhaar, voter_id, temp_image_path, verification_status) 
       VALUES (?, ?, ?, 'pending')
       ON DUPLICATE KEY UPDATE 
       temp_image_path = VALUES(temp_image_path),
       verification_status = 'pending',
       verification_attempts = 0`,
      [aadhaar, voterId, tempFilePath]
    );

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully. Face registration pending.',
      requirements: {
        imageSpecs: IMAGE_SPECS,
      },
    });

  } catch (error) {
    console.error('Face registration error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      requirements: {
        imageSpecs: IMAGE_SPECS,
      },
    });
  }
} 
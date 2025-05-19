//src/lib/server/face-processing.ts
import { db } from '@/lib/mysql';
import type { RowDataPacket } from 'mysql2';
import * as faceapi from 'face-api.js';
import { createCanvas, loadImage } from 'canvas';
import { fileTypeFromBuffer } from 'file-type';

const { Image, Canvas, ImageData } = require('canvas');
faceapi.env.monkeyPatch({
  Canvas: Canvas as any,
  Image: Image as any,
  ImageData: ImageData as any,
});

const MODEL_PATH = 'public/models';

export async function loadServerModels(): Promise<boolean> {
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH),
    faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH),
    faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH),
  ]);
  return true;
}

export async function processVoterPhoto(voter: any): Promise<{ success: boolean }> {
  try {
    console.log(`processVoterPhoto for ${voter.aadhaar}/${voter.voter_id}`);

    // Normalize photo to Buffer
    let buffer: Buffer;
    if (Buffer.isBuffer(voter.photo)) {
      buffer = voter.photo;
    } else if (typeof voter.photo === 'string') {
      console.log('Photo is string, assuming base64');
      const b64 = voter.photo.includes(',')
        ? voter.photo.split(',')[1]
        : voter.photo;
      buffer = Buffer.from(b64, 'base64');
    } else {
      console.error('Unsupported photo type:', typeof voter.photo);
      return { success: false }; // Return false if unsupported photo type
    }

    // Detect mime type and load image
    const type = await fileTypeFromBuffer(buffer);
    const mime = type?.mime || 'image/jpeg';
    const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    console.log('Loading image as dataURI', mime);
    const img = await loadImage(dataUrl);

    // Draw to canvas
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    console.log('Running detection…');
    const detection = await faceapi
      .detectSingleFace(canvas as any)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      console.warn('No face detected for', voter.aadhaar);
      return { success: false }; // Return false if no face detected
    }

    // Convert descriptor to array and debug print
    const descArray = Array.from(detection.descriptor);
    console.log('Got descriptor with length:', descArray.length);
    console.log('First few values:', descArray.slice(0, 10));

    // Store with JSON.stringify and explicit params
    const sql = `
      INSERT INTO face_descriptors 
        (aadhaar, voter_id, descriptor_data, verification_status) 
      VALUES (?, ?, ?, 'verified') 
      ON DUPLICATE KEY UPDATE 
        descriptor_data = VALUES(descriptor_data), 
        verification_status = 'verified'
    `;
    
    const params = [voter.aadhaar, voter.voter_id, JSON.stringify(descArray)];
    console.log('SQL params:', params);
    
    // Execute query with debug
    try {
      const result = await db.query(sql, params);
      console.log('SQL result:', result);
      console.log('Descriptor stored for', voter.aadhaar);
      return { success: true }; // Return success if descriptor stored
    } catch (dbErr) {
      console.error('Database error:', dbErr);
      return { success: false }; // Return false if database error
    }
  } catch (err) {
    console.error('processVoterPhoto error:', err);
    return { success: false }; // Return false if an error occurs
  }
}

export async function verifyFace(
  aadhaar: string,
  voterId: string,
  liveDescriptor: number[]
): Promise<{ match: boolean; distance: number }> {
  try {
    // Get stored descriptor
    const [rowsResult] = await db.query<(RowDataPacket & { descriptor_data: string | null })[]>(
      'SELECT descriptor_data FROM face_descriptors WHERE aadhaar = ? AND voter_id = ? AND verification_status = "verified"',
      [aadhaar, voterId]
    );

    // Ensure rows is an array
    const rows = Array.isArray(rowsResult) ? rowsResult : [];

    if (rows.length === 0 || !rows[0].descriptor_data) {
      console.error('No verified descriptor found for', aadhaar, voterId);
      return { match: false, distance: 1.0 };
    }

    // Parse stored descriptor
    let storedDescriptor: number[];
    try {
      const raw = rows[0].descriptor_data;
      storedDescriptor = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (jsonError) {
      console.error('Error parsing stored descriptor JSON:', jsonError);
      return { match: false, distance: 1.0 };
    }

    // Convert arrays to Float32Array for face-api comparison
    const stored = new Float32Array(storedDescriptor);
    const live = new Float32Array(liveDescriptor);

    // Calculate Euclidean distance
    const distance = faceapi.euclideanDistance(stored, live);
    const THRESHOLD = 0.55;

    return {
      match: distance < THRESHOLD,
      distance
    };
  } catch (err) {
    console.error('verifyFace error:', err);
    return { match: false, distance: 1.0 };
  }
}


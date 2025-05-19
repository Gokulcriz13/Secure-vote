// src/lib/server/face-processing.ts
import { db } from '@/lib/mysql';
import type { RowDataPacket } from 'mysql2';
import * as faceapi from 'face-api.js';
import { createCanvas, loadImage } from 'canvas';
import { fileTypeFromBuffer } from 'file-type';
import { compareDescriptors } from '../faceutils';
import { FaceVerificationPayload } from '@/types/FaceVerification';

const { Image, Canvas, ImageData } = require('canvas');
faceapi.env.monkeyPatch({
  Canvas: Canvas as any,
  Image: Image as any,
  ImageData: ImageData as any,
});

const MODEL_PATH = 'public/models';
let modelsLoaded = false;

export async function loadServerModels(): Promise<boolean> {
  if (modelsLoaded) return true;
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_PATH),
    faceapi.nets.faceLandmark68TinyNet.loadFromDisk(MODEL_PATH),
    faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH),
  ]);
  modelsLoaded = true;
  return true;
}

export async function processVoterPhoto(voter: any): Promise<{ success: boolean }> {
  try {
    console.log(`processVoterPhoto for ${voter.aadhaar}/${voter.voter_id}`);

    let buffer: Buffer;
    if (Buffer.isBuffer(voter.photo)) {
      buffer = voter.photo;
    } else if (typeof voter.photo === 'string') {
      console.log('Photo is string, assuming base64');
      const b64 = voter.photo.includes(',') ? voter.photo.split(',')[1] : voter.photo;
      buffer = Buffer.from(b64, 'base64');
    } else {
      console.error('Unsupported photo type:', typeof voter.photo);
      return { success: false };
    }

    const type = await fileTypeFromBuffer(buffer);
    const mime = type?.mime || 'image/jpeg';
    const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    console.log('Loading image as dataURI', mime);
    const img = await loadImage(dataUrl);

    if (img.width === 0 || img.height === 0) {
      console.error('Invalid image dimensions');
      return { success: false };
    }

    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    console.log('Running detection…');
    const detection = await faceapi
      .detectSingleFace(canvas as any, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    if (!detection) {
      console.warn('No face detected for', voter.aadhaar);
      return { success: false };
    }

    const descArray = Array.from(detection.descriptor);
    console.log('Got descriptor with length:', descArray.length);
    console.log('First few values:', descArray.slice(0, 50));

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
    
    try {
      const result = await db.query(sql, params);
      console.log('SQL result:', result);
      console.log('Descriptor stored for', voter.aadhaar);
      return { success: true };
    } catch (dbErr) {
      console.error('Database error:', dbErr);
      return { success: false };
    }
  } catch (err) {
    console.error('processVoterPhoto error:', err);
    return { success: false };
  }
}

const THRESHOLD = 0.65;

export async function verifyFace(
  payload: FaceVerificationPayload
): Promise<{ match: boolean; distance: number }> {
  const { liveDescriptor, storedDescriptor } = payload;

  if (!Array.isArray(liveDescriptor) || liveDescriptor.length !== 128) {
    console.error('Invalid live descriptor format');
    return { match: false, distance: 1.0 };
  }

  if (!Array.isArray(storedDescriptor) || storedDescriptor.length !== 128) {
    console.error('Invalid stored descriptor format');
    return { match: false, distance: 1.0 };
  }

  try {
    const { distance } = compareDescriptors(liveDescriptor, storedDescriptor);
    const match = distance < THRESHOLD;
    return { match, distance };
  } catch (err) {
    console.error('verifyFace error:', err);
    return { match: false, distance: 1.0 };
  }
}
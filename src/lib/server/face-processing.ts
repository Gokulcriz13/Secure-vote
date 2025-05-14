// src/lib/server/face-processing.ts
import { db } from '@/lib/mysql';
import * as faceapi from 'face-api.js';
import { Canvas, loadImage } from 'canvas';
import { fileTypeFromBuffer } from 'file-type';

const MODEL_PATH = 'public/models';

export async function loadServerModels(): Promise<boolean> {
await Promise.all([
faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_PATH),
faceapi.nets.faceLandmark68TinyNet.loadFromDisk(MODEL_PATH),
faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH),
]);
return true;
}

export async function processVoterPhoto(voter: any): Promise<boolean> {
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
  return false;
}

// Detect mime type and load image
const type = await fileTypeFromBuffer(buffer);
const mime = type?.mime || 'image/jpeg';
const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
console.log('Loading image as dataURI', mime);
const img = await loadImage(dataUrl);

// Draw to canvas
const cvs = new Canvas(img.width, img.height);
const ctx = cvs.getContext('2d');
ctx.drawImage(img, 0, 0);

console.log('Running detection…');
const detection = await faceapi
  .detectSingleFace(cvs as any, new faceapi.TinyFaceDetectorOptions())
  .withFaceLandmarks(true)
  .withFaceDescriptor();

if (!detection) {
  console.warn('No face detected for', voter.aadhaar);
  return false;
}

const descArray = Array.from(detection.descriptor);
await db.query(
  `INSERT INTO face_descriptors (aadhaar, voter_id, descriptor_data, verification_status)
   VALUES (?, ?, ?, 'verified')
   ON DUPLICATE KEY UPDATE
     descriptor_data = VALUES(descriptor_data),
     verification_status = 'verified'`,
  [voter.aadhaar, voter.voter_id, JSON.stringify(descArray)]
);
console.log('Descriptor stored for', voter.aadhaar);
return true;
} catch (err) {
  console.error('processVoterPhoto error:', err);
  return false;
  }
  }
 

import { db } from '@/lib/mysql';
import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData, loadImage } from 'canvas';
import { calculateDescriptorDistance } from '@/lib/faceutils';

const MODEL_PATH = 'public/models';

export async function loadServerModels(): Promise<void> {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_PATH),
    faceapi.nets.faceLandmark68TinyNet.loadFromDisk(MODEL_PATH),
    faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH),
  ]);
}

export async function processVoterPhoto(voter: any): Promise<boolean> {
  try {
    const img = await loadImage(voter.photo);
    const cvs = new Canvas(img.width, img.height);
    const ctx = cvs.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const detection = await faceapi
      .detectSingleFace(cvs as any, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    if (!detection) return false;
    const descArray = Array.from(detection.descriptor);

    await db.query(
      `INSERT INTO face_descriptors (aadhaar, voter_id, descriptor_data, verification_status)
       VALUES (?, ?, ?, 'verified')
       ON DUPLICATE KEY UPDATE descriptor_data = VALUES(descriptor_data), verification_status = 'verified'`,
      [voter.aadhaar, voter.voter_id, JSON.stringify(descArray)]
    );
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}
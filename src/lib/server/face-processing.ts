import { db } from '@/lib/mysql';

export async function processVoterPhoto(voter: any): Promise<boolean> {
  try {
    // Dynamically import modules only used on server
    const [{ default: faceapi }, { default: canvas }] = await Promise.all([
      import('face-api.js'),
      import('canvas')
    ]);
    
    const { createCanvas, loadImage } = canvas;

    // Create canvas and load image
    const img = await loadImage(voter.photo);
    const cvs = createCanvas(img.width, img.height);
    const ctx = cvs.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Detect face and get descriptor
    const detection = await faceapi
      .detectSingleFace(cvs as unknown as HTMLCanvasElement)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      console.error(`No face detected for voter ${voter.aadhaar}`);
      return false;
    }

    // Store descriptor in database
    await db.query(
      `INSERT INTO face_descriptors 
       (aadhaar, voter_id, descriptor_data, verification_status) 
       VALUES (?, ?, ?, 'verified')
       ON DUPLICATE KEY UPDATE 
       descriptor_data = VALUES(descriptor_data),
       verification_status = 'verified'`,
      [voter.aadhaar, voter.voter_id, JSON.stringify(Array.from(detection.descriptor))]
    );

    return true;
  } catch (error) {
    console.error(`Error processing voter ${voter.aadhaar}:`, error);
    return false;
  }
}

export async function loadServerModels() {
  const { default: faceapi } = await import('face-api.js');
  const { join } = await import('path');
  const modelPath = join(process.cwd(), 'public', 'models');
  
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath),
    faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
    faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath)
  ]);
} 
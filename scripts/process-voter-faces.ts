import * as faceapi from 'face-api.js';
import { db } from '../src/lib/mysql';
import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import fs from 'fs';

// Load face-api models
async function loadModels() {
  const modelPath = path.join(process.cwd(), 'public', 'models');
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
}

// Process a single voter's photo
async function processVoterPhoto(voter: any): Promise<boolean> {
  try {
    // Convert BLOB to temp file
    const photoBuffer = voter.photo;
    const tempPath = path.join(process.cwd(), 'temp', `${voter.aadhaar}_temp.jpg`);
    fs.writeFileSync(tempPath, photoBuffer);

    // Load image
    const img = await loadImage(tempPath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Detect face and get descriptor
    const detection = await faceapi
      .detectSingleFace(canvas as any)
      .withFaceLandmarks()
      .withFaceDescriptor();

    // Clean up temp file
    fs.unlinkSync(tempPath);

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

    console.log(`✅ Processed voter ${voter.aadhaar}`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing voter ${voter.aadhaar}:`, error);
    return false;
  }
}

async function main() {
  try {
    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Load models
    console.log('Loading face-api models...');
    await loadModels();
    console.log('Models loaded successfully');

    // Get all voters with photos
    const [voters] = await db.query<any[]>(
      'SELECT aadhaar, voter_id, photo FROM voters WHERE photo IS NOT NULL'
    );

    console.log(`Found ${voters?.length || 0} voters with photos`);

    // Process each voter 
    let successful = 0;
    let failed = 0;

    for (const voter of voters as any[]) {
      const success = await processVoterPhoto(voter);
      if (success) successful++;
      else failed++;
    }

    console.log('\nProcessing complete!');
    console.log(`✅ Successfully processed: ${successful}`);
    console.log(`❌ Failed to process: ${failed}`);

    // Clean up
    fs.rmdirSync(tempDir);
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main(); 
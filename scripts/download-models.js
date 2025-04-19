const https = require('https');
const fs = require('fs');
const path = require('path');

const models = [
  {
    name: 'face_recognition_model',
    files: [
      'face_recognition_model-weights_manifest.json',
      'face_recognition_model-shard1'
    ]
  },
  {
    name: 'face_landmark_68_model',
    files: [
      'face_landmark_68_model-weights_manifest.json',
      'face_landmark_68_model-shard1'
    ]
  },
  {
    name: 'ssd_mobilenetv1_model',
    files: [
      'ssd_mobilenetv1_model-weights_manifest.json',
      'ssd_mobilenetv1_model-shard1'
    ]
  }
];

const downloadFile = (url, filepath) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 404) {
        fs.unlink(filepath, () => {});
        reject(new Error(`File not found: ${url}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
};

const downloadModels = async () => {
  const modelsDir = path.join(__dirname, '../public/models');
  
  // Create models directory if it doesn't exist
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }
  
  // Clean up existing files
  const existingFiles = fs.readdirSync(modelsDir);
  for (const file of existingFiles) {
    fs.unlinkSync(path.join(modelsDir, file));
  }

  const baseUrl = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
  
  for (const model of models) {
    for (const file of model.files) {
      const url = `${baseUrl}/${file}`;
      const filepath = path.join(modelsDir, file);
      console.log(`Downloading ${file}...`);
      try {
        await downloadFile(url, filepath);
        console.log(`Successfully downloaded ${file}`);
      } catch (error) {
        console.error(`Failed to download ${file}:`, error.message);
      }
    }
  }
  
  console.log('Model download process completed!');
};

downloadModels().catch(console.error); 
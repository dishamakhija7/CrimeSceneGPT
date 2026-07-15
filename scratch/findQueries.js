import fs from 'fs';

const content = fs.readFileSync('src/components/Reconstruction3D.jsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for Firestore queries in Reconstruction3D.jsx...");
lines.forEach((line, idx) => {
  if (line.includes('db') || line.includes('getDoc') || line.includes('collection') || line.includes('query')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});

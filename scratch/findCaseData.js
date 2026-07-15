import fs from 'fs';

const content = fs.readFileSync('src/components/Reconstruction3D.jsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for caseData or loading in Reconstruction3D.jsx...");
lines.forEach((line, idx) => {
  if (line.includes('caseData') || line.includes('loading')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});

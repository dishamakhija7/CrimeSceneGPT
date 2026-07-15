import fs from 'fs';

const content = fs.readFileSync('src/components/Reconstruction3D.jsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for SimulationScene in Reconstruction3D.jsx...");
lines.forEach((line, idx) => {
  if (line.includes('SimulationScene')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});

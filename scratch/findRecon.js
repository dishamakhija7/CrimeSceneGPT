import fs from 'fs';

const content = fs.readFileSync('src/App.jsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for 'reconstruction' in App.jsx...");
lines.forEach((line, idx) => {
  if (line.includes('reconstruction')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});

import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const match = env.match(/VITE_GEMINI_API_KEY=(.*)/);
const key = match ? match[1].trim() : '';

console.log("Length:", key.length);
console.log("First 8:", key.slice(0, 8));
console.log("Last 8:", key.slice(-8));

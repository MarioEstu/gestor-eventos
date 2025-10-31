// backend/print-key.js
import fs from 'fs';
import path from 'path';

const json = JSON.parse(fs.readFileSync('pfdesarollo-firebase-adminsdk-fbsvc-2b6a0eee08.json','utf8'));
console.log(json.private_key.replace(/\r?\n/g,'\\n'));
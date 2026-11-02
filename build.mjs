import {mkdir,copyFile} from 'node:fs/promises';
await mkdir(new URL('./dist/',import.meta.url),{recursive:true});
for(const file of ['index.html','style.css','app.js','model.js','csv.js','data.js','diagnostics.js']) await copyFile(new URL(file,import.meta.url),new URL(`dist/${file}`,import.meta.url));
console.log('Static distribution refreshed: 7 local files.');

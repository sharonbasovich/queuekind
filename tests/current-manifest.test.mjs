import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
test('current browser verification accounts for every runtime source before browser launch',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../capture/verification-manifest.json',import.meta.url),'utf8'));
 const files=['index.html','app.js','model.js','csv.js','data.js','diagnostics.js','style.css','queue-view.js','score-evidence.js'];
 assert.equal(manifest.reviewedAppCommit,'score-evidence-v1');assert.equal(manifest.algorithm,'sha256');assert.deepEqual(Object.keys(manifest.files).sort(),[...files].sort());
 for(const f of files)assert.equal(createHash('sha256').update(readFileSync(new URL('../'+f,import.meta.url))).digest('hex'),manifest.files[f],f);
 const script=readFileSync(new URL('../capture/record.mjs',import.meta.url),'utf8');assert.ok(script.includes("verifyCurrent?'score-evidence-v1'"));assert.ok(script.includes("verifyCurrent?['queue-view.js','score-evidence.js']:[]"));
});

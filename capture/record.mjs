// CI-only: interact with the real app. No HTML injection, DOM rewriting or model mocks.
import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.resolve(process.env.QUEUEKIND_ROOT||process.cwd());
const out=path.resolve(process.env.QUEUEKIND_CAPTURE_OUTPUT||'capture-output');
const url='http://127.0.0.1:4173/';
const {examples,requests}=await import(pathToFileURL(path.join(root,'data.js')));
const {splitExamples,fit,evaluate}=await import(pathToFileURL(path.join(root,'model.js')));
const {parseCSV,exportCSV}=await import(pathToFileURL(path.join(root,'csv.js')));
assert.equal(examples.length,48);assert.equal(requests.length,6);
const split=splitExamples(examples),baseline=evaluate(fit(split.train),split.test);
await fs.mkdir(out,{recursive:true});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const verifyCurrent=process.env.QUEUEKIND_VERIFY_CURRENT==='1';
assert.ok(!(verifyCurrent&&process.env.QUEUEKIND_FILM==='1'),'Current verification must not produce a film');
const runtimeManifest=JSON.parse(await fs.readFile(new URL(verifyCurrent?'./verification-manifest.json':'./runtime-manifest.json',import.meta.url),'utf8'));
assert.equal(runtimeManifest.algorithm,'sha256');
assert.equal(runtimeManifest.reviewedAppCommit,verifyCurrent?'session-exit-guard-v1':'123cb39105e9bb368439d253922ca853c15c4044');
const sourceHashes={};for(const file of ['index.html','app.js','model.js','csv.js','data.js','diagnostics.js','style.css',...(verifyCurrent?['queue-view.js']:[])]){
 const source=await fs.readFile(path.join(root,file)),built=await fs.readFile(path.join(root,'dist',file));
 assert.equal(sha(source),sha(built),`Build differs from source: ${file}`);sourceHashes[file]=sha(source);assert.equal(sourceHashes[file],runtimeManifest.files[file],`Unreviewed runtime changed: ${file}`);
}
let commit=process.env.GITHUB_SHA||'unknown';
if(commit==='unknown'){try{commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();}catch{}}
const film=process.env.QUEUEKIND_FILM==='1';
const browser=await chromium.launch();
// Actual Chromium file-input tests, isolated from the timed film and its sample session.
const importContext=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
const importPage=await importContext.newPage(),importErrors=[];
await importContext.route('**/*',async route=>{const u=new URL(route.request().url());if(u.protocol==='http:'&&u.hostname==='127.0.0.1'&&u.port==='4173')return route.continue();importErrors.push('Blocked external request: '+route.request().url());await route.abort();});
importPage.on('pageerror',e=>importErrors.push(String(e)));
try {
 await importPage.goto(url);
 await importPage.locator('#examplesFile').setInputFiles({name:'synthetic-examples.csv',mimeType:'text/csv',buffer:Buffer.from(exportCSV(examples))});
 await expect(importPage.locator('#exampleSummary')).toContainText('48 unique examples');
 await importPage.locator('#train').click();
 await importPage.locator('#tab-review').click();
 await importPage.locator('#queueFile').setInputFiles({name:'synthetic-requests.csv',mimeType:'text/csv',buffer:Buffer.from(exportCSV(requests.slice(0,2).map(text=>({text})),['text']))});
 await expect(importPage.locator('.request-card')).toHaveCount(2);
 await importPage.locator('#queueFile').setInputFiles({name:'invalid.csv',mimeType:'text/csv',buffer:Buffer.from('wrong_header\nexample')});
 await expect(importPage.locator('#notice')).toContainText('Include a text column');
 await expect(importPage.locator('.request-card')).toHaveCount(2);
 await importPage.locator('#queueFile').setInputFiles({name:'oversized.csv',mimeType:'text/csv',buffer:Buffer.alloc(2_000_001,65)});
 await expect(importPage.locator('#notice')).toContainText('smaller than 2 MB');
 await expect(importPage.locator('.request-card')).toHaveCount(2);
 assert.deepEqual(importErrors,[]);
 await fs.writeFile(path.join(out,'import-qa.json'),JSON.stringify({commit,syntheticOnly:true,actualChromiumFileInput:true,nativeCloudBrowserPickerTested:false,passed:['48-example CSV import and train','2-request CSV import','invalid-header rejection preserves queue','over-2MB rejection preserves queue'],errors:importErrors},null,2));
} catch(error) {
 await fs.writeFile(path.join(out,'import-failure.json'),JSON.stringify({error:String(error),errors:importErrors},null,2));
 await importPage.screenshot({path:path.join(out,'import-failure.png')}).catch(()=>{});
 await browser.close();throw error;
} finally {await importContext.close();}

const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1,locale:'en-US',timezoneId:'UTC',reducedMotion:'reduce',acceptDownloads:true,recordVideo:{dir:out,size:{width:1280,height:800}}});
const videoStartApprox=performance.now();
const page=await context.newPage(),video=page.video(),errors=[],events=[],externalRequests=[];
let started=performance.now(),exportEvidence=null;
const event=(name,details={})=>events.push({name,seconds:Number(((performance.now()-started)/1000).toFixed(3)),...details});
const at=async seconds=>{if(film){const left=seconds*1000-(performance.now()-started);if(left>0)await page.waitForTimeout(left);}};
const shot=async name=>page.screenshot({path:path.join(out,name+'.png'),fullPage:false});
page.on('pageerror',e=>errors.push({type:'pageerror',message:String(e)}));
page.on('console',m=>{if(m.type()==='error')errors.push({type:'console',message:m.text()});});
await context.route('**/*',async route=>{
 const u=new URL(route.request().url());
 if(u.protocol==='http:'&&u.hostname==='127.0.0.1'&&u.port==='4173')return route.continue();
 externalRequests.push(route.request().url());await route.abort();
});
try{
 await page.goto(url,{waitUntil:'networkidle'});started=performance.now();
 await page.getByRole('heading',{name:'A little help. A human decision.',exact:true}).waitFor();
 event('real-app-opening');await shot('01-opening');await at(8);
 await page.locator('#demo').click();
 await page.locator('.request-card').nth(5).waitFor();assert.equal(await page.locator('.request-card').count(),6);
 assert.match(await page.locator('#notice').innerText(),/48 invented examples and 6 invented requests/);
 event('synthetic-workspace-loaded',{examples:48,requests:6});await at(15);
 await page.locator('#tab-check').click();await page.locator('#metricsContent').scrollIntoViewIfNeeded();
 assert.equal(await page.locator('.metric b').nth(0).innerText(),`${baseline.correct}/${baseline.total}`);
 assert.match(await page.locator('#metricsContent .warning').innerText(),/not evidence of real-world reliability/);
 event('actual-heldout-results',{matched:baseline.correct,total:baseline.total,macroF1:baseline.macroF1,uncertain:baseline.review});await shot('02-heldout');await at(27);
 await page.locator('#diagnostic-title').scrollIntoViewIfNeeded();
 assert.equal(await page.locator('.diagnostics > .diagnostic-list .diagnostic-case').count(),baseline.total-baseline.correct);
 assert.match(await page.locator('.diagnostics').innerText(),/not verified ground truth/);
 event('actual-confusion-pairs-visible',{count:baseline.total-baseline.correct});await shot('03a-confusion-pairs');await at(32);
 const firstMismatch=page.locator('.diagnostics > .diagnostic-list .diagnostic-case').first();
 await firstMismatch.scrollIntoViewIfNeeded();
 await expect(firstMismatch).toBeInViewport({ratio:1});
 await expect(firstMismatch.locator('.diagnostic-route')).toContainText('Expected label');
 await expect(firstMismatch.locator('.diagnostic-route')).toContainText('Suggested route');
 await expect(firstMismatch.locator('.small-note')).not.toHaveText('');
 event('actual-mismatch-case-visible',{caseText:await firstMismatch.innerText()});await shot('03-mismatches');await at(42);
 await page.locator('#tab-review').click();
 const unsupported=page.locator('.request-card').filter({hasText:requests[4]});
 await unsupported.scrollIntoViewIfNeeded();await shot('04-unsupported-before');await at(49);
 await unsupported.locator('select').selectOption({label:'Hold for follow-up / no suitable route'});
 await unsupported.getByRole('button',{name:'Mark reviewed ✓',exact:true}).click();
 assert.match(await unsupported.innerText(),/Held for follow-up · no route assigned/);
 assert.equal(await page.locator('#retrain').isDisabled(),true,'Hold-only review must not enable training');
 event('unsupported-request-held-no-training-change');await shot('05-held');await at(60);
 const valid=page.locator('.request-card').filter({hasText:requests[0]});
 await valid.scrollIntoViewIfNeeded();await at(64);
 await valid.locator('select').selectOption({label:'Food support'});
 await valid.getByRole('button',{name:'Mark reviewed ✓',exact:true}).click();
 assert.match(await valid.innerText(),/Confirmed route: Food support/);
 assert.equal(await page.locator('#retrain').isEnabled(),true);
 event('synthetic-request-manually-routed');await shot('06-reviewed');await at(76);
 await page.locator('#export').scrollIntoViewIfNeeded();
 const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();
 const download=await downloadPromise;assert.equal(download.suggestedFilename(),'queuekind-reviewed.csv');
 const exportPath=path.join(out,'queuekind-reviewed.csv');await download.saveAs(exportPath);
 const bytes=await fs.readFile(exportPath),rows=parseCSV(bytes.toString('utf8'));
 assert.equal(rows.length,2);assert.deepEqual(rows.map(r=>r.data_origin),['synthetic_demo','synthetic_demo']);
 const routed=rows.find(r=>r.text===requests[0]),held=rows.find(r=>r.text===requests[4]);
 assert.ok(routed&&held);assert.equal(routed.label,'Food support');assert.equal(routed.review_status,'human_reviewed');
 assert.equal(held.label,'');assert.equal(held.review_status,'needs_follow_up');
 assert.deepEqual(rows.map(r=>String(r.model_version)),['1','1']);
 exportEvidence={sha256:sha(bytes),bytes:bytes.length,rows:2,routed:1,held:1};
 event('actual-downloaded-export-verified',exportEvidence);
 await expect(page.locator('#notice')).toContainText('Exported 2 reviewed requests');
 await page.locator('#notice').scrollIntoViewIfNeeded();
 await expect(page.locator('#notice')).toBeInViewport({ratio:1});
 event('export-confirmation-visible');await shot('07-export');await at(87);
 await page.locator('#retrain').click();
 assert.match(await page.locator('#queueSummary').innerText(),/model v2/);
 assert.equal(await page.locator('#retrain').isDisabled(),true);
 await page.locator('#tab-check').click();await page.locator('#metricsContent').scrollIntoViewIfNeeded();
 assert.equal(await page.locator('.metric b').nth(3).innerText(),'v2');
 assert.match(await page.locator('#metricsContent .warning').innerText(),/not new independent validation/);
 assert.match(await page.locator('.metric').nth(3).innerText(),/37 training examples/);
 event('reviewed-route-learned-held-request-excluded',{trainingExamples:37,heldout:12});await shot('08-retrained');await at(100);
 await page.locator('#metricsContent .guidance').scrollIntoViewIfNeeded();event('visible-model-limitations');await shot('09-limitations');await at(112);
 assert.deepEqual(errors,[]);assert.deepEqual(externalRequests,[]);
 const elapsedSeconds=(performance.now()-started)/1000;
 if(film)assert.ok(elapsedSeconds>=112&&elapsedSeconds<125,`Timing drift: ${elapsedSeconds}`);
 await fs.writeFile(path.join(out,'audit.json'),JSON.stringify({commit,reviewedAppCommit:runtimeManifest.reviewedAppCommit,sourceHashes,events,errors,externalRequests,exportEvidence,film,elapsedSeconds,captionPlanOffsetApproxSeconds:(started-videoStartApprox)/1000,capture:{viewport:'1280x800',silent:true,reducedMotion:true,syntheticOnly:true},scope:'Actual browser interactions and downloaded CSV. Scripted synthetic choices; no real-user study, audio review, automatic routing or independent post-correction validation.'},null,2));
}catch(error){
 await fs.writeFile(path.join(out,'failure.json'),JSON.stringify({commit,error:String(error),events,errors,externalRequests},null,2));
 await shot('failure').catch(()=>{});throw error;
}finally{
 await context.close();if(video)await fs.rename(await video.path(),path.join(out,'queuekind-raw-silent.webm'));await browser.close();
}


// Actual Chromium regression: do not rewrite the DOM or mock application state.
import {chromium,expect} from '@playwright/test';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
import {examples} from '../data.js';import {exportCSV,parseCSV} from '../csv.js';
const base=process.env.QUEUEKIND_URL||'http://127.0.0.1:4173/';
const out='route-label-output';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch();const errors=[],checks=[];
try{
 for(const width of [1280,390])for(const [index,label] of ['Food  support','Food\tsupport','Food\nsupport','Food\rsupport','Food\r\nsupport','Food "support" & <pantry>','Café 食品'].entries()){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(base);const csv=exportCSV(examples.map(r=>({...r,label:r.label==='Food support'?label:r.label})));
  await page.locator('#examplesFile').setInputFiles({name:'synthetic-labels.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});
  await expect(page.locator('#exampleSummary')).toContainText('48 unique examples');await page.locator('#train').click();await page.locator('#tab-review').click();
  await page.locator('#requestText').fill('fresh pantry food delivery');await page.locator('#addRequest').click();
  await page.locator('#route-0').selectOption(label);await expect(page.locator('#route-0')).toHaveValue(label);
  await page.locator('#queueFilter').selectOption('awaiting');await expect(page.locator('#route-0')).toHaveValue(label);
  page.once('dialog',d=>d.accept());await page.locator('[data-remove="0"]').click();await page.locator('#undoRemoval').click();await expect(page.locator('#route-0')).toHaveValue(label);await expect(page.locator('#route-0')).toBeFocused();
  if(index===0)await page.screenshot({path:`${out}/selected-${width}.png`,fullPage:true});
  await page.locator('[data-confirm="0"]').click();await page.locator('#queueFilter').selectOption('reviewed');
  const pending=page.waitForEvent('download');await page.locator('#export').click();const file=await pending;const text=await fs.readFile(await file.path(),'utf8');assert.equal(parseCSV(text)[0].label,label);
  await page.locator('#retrain').click();await expect(page.locator('#notice')).toContainText('Model 2 trained');await expect(page.locator('#retrain')).toBeDisabled();
  await page.locator('[data-undo="0"]').click();await page.locator('#queueFilter').selectOption('awaiting');await expect(page.locator('#route-0')).toHaveValue(label);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));checks.push({width,label,passed:true});await page.close();
 }
 assert.deepEqual(errors,[]);await fs.writeFile(`${out}/results.json`,JSON.stringify({base,checks,errors},null,2));
}finally{await browser.close();}
console.log(`PASS ${checks.length} exact-label browser flows`);

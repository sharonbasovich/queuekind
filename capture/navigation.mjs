import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
await fs.mkdir('navigation-output',{recursive:true});
const browser=await chromium.launch();
for(const width of [1280,390]){
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:4173');
 await page.reload(); // Empty workspace has no prompt.
 await page.locator('#demo').click();
 await page.locator('#route-0').selectOption('Food support');
 await page.locator('[data-confirm="0"]').click();
 await expect(page.locator('#count-reviewed')).toHaveText('1');
 await page.locator('#requestText').fill('Unsaved request draft');
 const before=await page.locator('#queueSummary').innerText();
 const tryLeave=async()=>{
  const shown=page.waitForEvent('dialog');
  const navigation=page.reload().catch(error=>error);
  const dialog=await shown;assert.equal(dialog.type(),'beforeunload');await dialog.dismiss();await navigation;
  await expect(page.locator('#queueSummary')).toHaveText(before);
  await expect(page.locator('#requestText')).toHaveValue('Unsaved request draft');
 };
 await tryLeave();
 const download=page.waitForEvent('download');await page.locator('#export').click();await download;
 await tryLeave(); // Exported decisions do not back up the queue/model/draft.
 page.once('dialog',d=>d.dismiss());await page.locator('#reset').click();
 await tryLeave();
 const dialogs=[];page.on('dialog',d=>{dialogs.push(d.type());d.accept()});
 await page.locator('#reset').click();await expect(page.locator('#datasetBadge')).toHaveText('No data loaded');
 assert.deepEqual(dialogs,['confirm'],'Explicit reset must not require a second browser prompt');
 await page.close();
}
await browser.close();await fs.writeFile('navigation-output/results.json',JSON.stringify({passed:true,widths:[1280,390],scope:'Chromium native beforeunload cancellation and explicit reset, not mobile OS termination'}));

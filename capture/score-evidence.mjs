// Real Chromium checks; all inputs are synthetic. No UI replacement or model mocks.
import {chromium,expect} from '@playwright/test';import assert from 'node:assert/strict';
const browser=await chromium.launch();const errors=[];
try{
 for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(process.env.QUEUEKIND_URL||'http://127.0.0.1:4173/');await page.locator('#demo').click();
  const detail=page.locator('.score-evidence').first(),summary=detail.locator('summary');
  await expect(detail).not.toHaveAttribute('open','');await summary.focus();await page.keyboard.press('Enter');await expect(detail).toHaveAttribute('open','');await expect(summary).toBeFocused();
  await expect(detail).toContainText('Total log-score difference');await expect(detail).toContainText('class prior');await expect(detail).toContainText('not probabilities');
  await page.keyboard.press('Space');await expect(detail).not.toHaveAttribute('open','');await page.keyboard.press('Enter');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#requestText').fill('food food transport unknownzz');await page.locator('#addRequest').click();
  const added=page.locator('.request-card').last();await added.locator('summary').click();await expect(added.locator('.score-evidence')).toContainText('unknown');
  await added.locator('select').selectOption('Food support');await added.locator('[data-confirm]').click();await expect(added).toContainText('Human reviewed');
  await added.locator('[data-undo]').click();await expect(added.locator('select')).toBeFocused();await page.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS real-browser score disclosure, keyboard, narrow layout, repeated open/close, review and undo');
}finally{await browser.close();}

import {test,expect} from '@playwright/test';
async function ready(page){await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-world-ready','true');}

test('spark hunt can be completed, celebrated and replayed without locking portfolio content',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);await page.locator('#begin').click();await expect(page.locator('#game-hud')).toBeVisible();await expect(page.locator('.spark-target:visible')).toHaveCount(8);
  for(let i=0;i<8;i++){const spark=page.locator(`[data-spark="${i}"]`);if(await spark.isVisible()){await spark.click();await expect(spark).toBeHidden();}}
  await expect(page.locator('#spark-score')).toHaveText('8 / 8');await expect(page.locator('#toast')).toContainText('Certified possibility explorer');await expect(page.locator('#world')).not.toHaveClass(/playing/);await page.locator('#begin').click();await expect(page.locator('#spark-score')).toHaveText('0 / 8');await page.locator('#end-game').click();await page.locator('[data-destination="systems"]').click();await expect(page.locator('#detail')).toBeVisible();expect(errors).toEqual([]);
});

test('keyboard movement and mobile touch controls work during play',async({page})=>{
  await page.setViewportSize({width:390,height:844});await ready(page);await page.locator('#begin').click();await expect(page.locator('#game-controls')).toBeVisible();await expect(page.locator('#scene canvas')).toBeFocused();await page.keyboard.down('ArrowLeft');await page.waitForTimeout(300);await page.keyboard.up('ArrowLeft');await page.keyboard.press('Space');await page.locator('#hop').click();await page.locator('[data-move="up"]').focus();await page.keyboard.press('Enter');await page.locator('[data-spark="0"]').click();await expect(page.locator('[data-spark="0"]')).toBeHidden();await expect(page.locator('#spark-score')).not.toHaveText('0 / 8');await page.locator('#end-game').click();await expect(page.locator('#game-controls')).toBeHidden();
});

test('reduced motion supports the game without confetti; audio is opt-in',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await ready(page);await expect(page.locator('#sound')).toHaveAttribute('aria-pressed','false');await page.locator('#sound').click();await expect(page.locator('#sound')).toHaveAttribute('aria-pressed','true');await page.locator('#sound').click();await page.locator('#begin').click();await page.locator('[data-spark="0"]').click();await expect(page.locator('[data-spark="0"]')).toBeHidden();await expect(page.locator('.celebrate-screen')).toHaveCount(0);await page.locator('#end-game').click();
});

test('opening content pauses the game clock and closing resumes it',async({page})=>{
  await ready(page);await page.locator('#begin').click();await page.locator('[data-destination="about"]').click();await expect(page.locator('#detail')).toBeVisible();const before=await page.locator('#game-time').textContent();await page.waitForTimeout(1200);await expect(page.locator('#game-time')).toHaveText(before);await page.locator('#close-detail').click();await expect(page.locator('#game-time')).not.toHaveText(before);
});

test('touch spark hunt stays playable after rotating a phone',async({browser})=>{
  const context=await browser.newContext({hasTouch:true,viewport:{width:390,height:844}});const page=await context.newPage();await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:4173');await expect(page.locator('body')).toHaveAttribute('data-world-ready','true');await page.locator('#begin').tap();await expect(page.locator('.spark-target:visible')).toHaveCount(8);
  for(let i=0;i<8;i++){if(i===4)await page.setViewportSize({width:844,height:390});const star=page.locator(`[data-spark="${i}"]`);if(await star.isVisible()){await star.tap();await expect(star).toBeHidden();}}
  await expect(page.locator('#spark-score')).toHaveText('8 / 8');await context.close();
});

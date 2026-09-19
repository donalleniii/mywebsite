import {test,expect} from '@playwright/test';
async function open(page,kind='shore'){await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.locator(`[data-era="${kind==='shore'?7:6}"]`).click();await page.locator('#object-action').click();await expect(page.locator('#workshop-canvas')).toBeVisible();if(await page.locator('body').getAttribute('data-renderer')==='3d')await expect(page.locator('.stage-wrap')).toHaveAttribute('data-reader-ready','true');}
const positions=page=>page.locator('#workshop-canvas').evaluate(c=>JSON.parse(c.dataset.positions));
test('rock physics: rotation, soft gravity, collision, retry and preserved state',async({page})=>{
 await open(page);const c=page.locator('#workshop-canvas');await expect(c).toHaveAttribute('data-selected','true');
 await page.locator('[data-work="right"]').click();await expect.poll(()=>c.getAttribute('data-angle')).not.toBe('0');
 await page.locator('[data-work="left"]').click();await page.locator('[data-work="drop"]').click();
 await expect.poll(async()=>(await positions(page))[1].y,{timeout:12000}).toBeGreaterThan(300);
 await page.waitForTimeout(1500);const stack=await positions(page);expect(stack[1].y).toBeLessThan(stack[0].y-25);expect(stack[0].y).toBeLessThan(465);
 await page.locator('[data-work="add"]').click();await expect(c).toHaveAttribute('data-pieces','3');await page.locator('[data-work="drop"]').click();await expect(page.locator('#note-title')).toHaveText('A little tension. A little clarity.');
 await page.locator('[data-work="pause"]').click();const frozen=await c.getAttribute('data-positions');await page.waitForTimeout(250);await expect(c).toHaveAttribute('data-positions',frozen);
 await page.keyboard.press('Escape');await page.locator('#object-action').click();await expect(c).toHaveAttribute('data-pieces','3');
 await page.locator('[data-work="reset"]').click();await expect(c).toHaveAttribute('data-pieces','2');await expect(page.locator('#note-title')).toHaveText('A moment without a device.');
});
test('city pieces can be dragged, rotated by keyboard and changed in shape',async({page})=>{
 await open(page,'blocks');const c=page.locator('#workshop-canvas');await c.scrollIntoViewIfNeeded();const box=await c.boundingBox();await page.mouse.move(box.x+box.width*.5,box.y+box.height*190/520);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.45,{steps:6});await page.mouse.up();await expect(c).toHaveAttribute('data-selected','false');
 expect((await positions(page))[2].x).toBeGreaterThan(580);
 await page.locator('#block-shape').selectOption('wedge');await page.locator('[data-work="add"]').click();await expect(c).toHaveAttribute('data-pieces','4');
 await c.focus();await page.keyboard.press('q');await expect.poll(()=>c.getAttribute('data-angle')).not.toBe('0');await page.keyboard.press('ArrowLeft');await page.keyboard.press('Space');await expect(c).toHaveAttribute('data-selected','false');
 await page.locator('[data-work="story"]').click();await expect(page.locator('#note-copy')).toContainText('adult');
 await page.locator('[data-read="systems"]').click();await expect(page.locator('#workshop-canvas')).toHaveCount(0);await expect(page.getByRole('link',{name:'Meet FormWright'})).toBeVisible();
});
test('touch, reduced motion and rotated phone keep workshop controls accessible',async({browser})=>{
 const context=await browser.newContext({hasTouch:true,reducedMotion:'reduce',viewport:{width:390,height:844}}),page=await context.newPage();await open(page);
 await page.locator('[data-work="right"]').tap();await expect.poll(()=>page.locator('#workshop-canvas').getAttribute('data-angle')).not.toBe('0');
 await page.locator('[data-work="drop"]').tap();await expect(page.locator('#workshop-canvas')).toHaveAttribute('data-selected','false');
 await page.setViewportSize({width:844,height:390});await page.locator('[data-work="add"]').tap();await expect(page.locator('#workshop-canvas')).toHaveAttribute('data-pieces','3');
 expect(await page.locator('#reader-scroll').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);await page.locator('#close-detail').tap();await expect(page.locator('body')).toHaveAttribute('data-reading','false');await context.close();
});
test('postcard reflects visited worlds and downloads a real PNG',async({page})=>{
 await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.locator('[data-era="6"]').click();await expect(page.locator('#journey-count')).toHaveText('2 of 9 worlds explored');
 const download=page.waitForEvent('download');await page.locator('#save-postcard').click();const d=await download;expect(d.suggestedFilename()).toBe('a-little-journey-with-don.png');expect(await d.failure()).toBeNull();
});
test('career highlights and collaboration form intent stay distinct from submission',async({page})=>{
 await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-ready','true');await expect(page.locator('.masterclass-feature')).toHaveAttribute('href','https://www.masterclass.com/series/achieve-more-with-gen-ai');
 await page.evaluate(()=>{window.intents=[];window.addEventListener('don:conversion',e=>window.intents.push(e.detail));document.addEventListener('click',e=>{if(e.target.closest('[data-collaborate]'))e.preventDefault();});});
 await page.locator('[data-collaborate="header"]').click();expect(await page.evaluate(()=>window.intents)).toEqual([{name:'collaboration_form_open',placement:'header',world:'handheld'}]);
 await page.locator('[data-content="connect"]').click();await expect(page.locator('[data-collaborate="connect-top"]')).toBeVisible();await expect(page.locator('[data-collaborate="connect-top"]')).toHaveAttribute('href','https://forms.gle/QVLGQnNdkHDoeVA77');
});
test('workshop import failure and WebGL fallback retain navigation',async({page})=>{
 await page.route('**/device-stage.js',r=>r.abort());await open(page);await expect(page.locator('body')).toHaveAttribute('data-renderer','2d');await page.locator('[data-work="right"]').click();await expect.poll(()=>page.locator('#workshop-canvas').getAttribute('data-angle')).not.toBe('0');
 await page.unroute('**/device-stage.js');await page.route('**/workshop.js',r=>r.abort());await page.reload();await page.locator('[data-era="7"]').click();await page.locator('#object-action').click();await expect(page.locator('#detail-content')).toContainText('could not load');await page.locator('[data-read="about"]').click();await expect(page.locator('#detail-title')).toContainText('catalyst');
});

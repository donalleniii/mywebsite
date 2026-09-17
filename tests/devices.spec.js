import {test,expect} from '@playwright/test';
const eras=['handheld','desktop','flip','modern','future'];
async function ready(page){await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-ready','true');await expect(page.locator('body')).toHaveAttribute('data-renderer','3d');}
async function holdUntil(page,key,predicate){await page.keyboard.down(key);try{await page.waitForFunction(predicate);}finally{await page.keyboard.up(key);}}
async function tapScreen(page,u,v){const r=await page.locator('#device-stage canvas').boundingBox();await page.mouse.click(r.x+r.width/2+(u-.5)*r.width*.8*Math.cos(.22),r.y+r.height/2+(v-.5)*r.width*.8/1.5);}

test('default handheld and persistent Don across all five devices',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);await expect(page.locator('body')).toHaveAttribute('data-era','handheld');await page.locator('#device-stage canvas').focus();await holdUntil(page,'d',()=>Number(document.querySelector('#device-stage').dataset.playerX)>7.4);const x=await page.locator('#device-stage').getAttribute('data-player-x'),y=await page.locator('#device-stage').getAttribute('data-player-y');
 for(let i=1;i<5;i++){await page.locator('#next-device').click();await expect(page.locator('body')).toHaveAttribute('data-era',eras[i]);await expect(page.locator('#device-stage')).toHaveAttribute('data-player-id','little-don');await expect(page.locator('#device-stage')).toHaveAttribute('data-player-x',x);await expect(page.locator('#device-stage')).toHaveAttribute('data-player-y',y);}await page.locator('#next-device').click();await expect(page.locator('body')).toHaveAttribute('data-era','handheld');expect(errors).toEqual([]);
});

test('WASD and Enter activate the in-game next-device portal',async({page})=>{
 await ready(page);await page.locator('#device-stage canvas').focus();await holdUntil(page,'d',()=>Number(document.querySelector('#device-stage').dataset.playerX)>11.1);await holdUntil(page,'w',()=>Number(document.querySelector('#device-stage').dataset.playerY)<5.3);await expect(page.locator('#interaction-hint')).toContainText('desktop');await page.keyboard.press('Enter');await expect(page.locator('body')).toHaveAttribute('data-era','desktop');
});

test('actual 3D screen raycasting selects a device portal',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await ready(page);await page.locator('#focus-screen').click();await tapScreen(page,.8,.60625);await expect(page.locator('body')).toHaveAttribute('data-era','desktop',{timeout:10000});
});

test('actual screen content portal opens and restores focus on Escape',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await ready(page);await page.locator('#focus-screen').click();await tapScreen(page,(16+2.1*32)/480,(34+2*32)/320);await expect(page.locator('#detail')).toBeVisible({timeout:10000});await expect(page.locator('#detail-title')).toContainText('catalyst');await expect(page.locator('#close-detail')).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(page.locator('#back-to-device')).toBeFocused();await page.keyboard.press('Escape');await expect(page.locator('#detail')).not.toBeVisible();await expect(page.locator('#device-stage canvas')).toBeFocused();
});

test('collected curiosity persists across eras',async({page})=>{
 await ready(page);await page.locator('#device-stage canvas').focus();await holdUntil(page,'a',()=>document.querySelector('#curiosity').textContent!=='✦ 0');await page.locator('[data-era="4"]').click();await expect(page.locator('#curiosity')).not.toHaveText('✦ 0');
});

for(const [name,width,height] of [['phone',390,844],['small-phone',320,568],['landscape',844,390],['tablet',768,1024],['foldable-size',720,960],['laptop',1440,900]]){
 test(`${name}: all devices, content and orientation changes`,async({page})=>{
  await page.setViewportSize({width,height});await ready(page);for(let i=0;i<5;i++){await page.locator(`[data-era="${i}"]`).click();await expect(page.locator('body')).toHaveAttribute('data-era',eras[i]);await page.locator('[data-content="about"]').click();await expect(page.locator('#detail')).toBeVisible();await page.locator('#close-detail').click();}expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.setViewportSize({width:height,height:width});await page.locator('#focus-screen').click();await page.locator('[data-content="systems"]').click();await expect(page.getByRole('link',{name:'Meet FormWright'})).toHaveAttribute('href','formwright.html');await page.locator('#close-detail').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}

test('touch interface and on-screen directional controls',async({browser})=>{
 const context=await browser.newContext({hasTouch:true,viewport:{width:390,height:844}}),page=await context.newPage();await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:4173');await expect(page.locator('body')).toHaveAttribute('data-ready','true');await page.locator('[data-move="right"]').tap();await expect.poll(async()=>Number(await page.locator('#device-stage').getAttribute('data-player-x'))).toBeGreaterThan(6.5);await page.locator('#focus-screen').tap();await expect(page.locator('#focus-screen')).toHaveAttribute('aria-pressed','true');await page.locator('[data-era="2"]').tap();await expect(page.locator('body')).toHaveAttribute('data-era','flip');await context.close();
});

test('reduced motion, sound opt-in, and modal movement suspension',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await ready(page);await expect(page.locator('#motion')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#sound')).toHaveAttribute('aria-pressed','false');await page.locator('#sound').click();await expect(page.locator('#sound')).toHaveAttribute('aria-pressed','true');await page.locator('[data-content="about"]').click();const x=await page.locator('#device-stage').getAttribute('data-player-x');await page.keyboard.press('d');await expect(page.locator('#device-stage')).toHaveAttribute('data-player-x',x);
});

test('WebGL module failure retains a playable 2D world',async({page})=>{
 await page.route('**/device-stage.js',r=>r.abort());await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-renderer','2d');await page.locator('.fallback-game').focus();await holdUntil(page,'d',()=>Number(document.querySelector('#device-stage').dataset.playerX)>7.2);await page.locator('[data-content="connect"]').click();await expect(page.getByRole('link',{name:'Start a conversation'})).toBeVisible();
});

test('all portfolio content, legacy bookmarks and retained pages',async({page,request})=>{
 await ready(page);for(const id of ['about','systems','omniii','keynotes','resources','connect']){await page.locator(`[data-content="${id}"]`).click();await expect(page.locator('#detail-title')).not.toBeEmpty();await page.locator('#close-detail').click();}await page.goto('/#podcast');await expect(page.locator('#detail')).toBeVisible();await expect(page.getByRole('link',{name:'Listen to the podcast'})).toHaveAttribute('href','https://open.spotify.com/show/3B9nZzv9zfdGlHMMvDKcdb');for(const path of ['/classic.html','/formwright.html','/phantom-grid.html','/omniii-support.html','/omniii-privacy.html','/omniii-terms.html'])expect((await request.get(path)).ok()).toBe(true);
});

test('no JavaScript retains the classic portfolio link',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false}),page=await context.newPage();await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:4173');await expect(page.locator('noscript a')).toHaveAttribute('href','classic.html');await context.close();
});

test('WASD keeps working after choosing a device from the timeline',async({page})=>{
 await ready(page);await page.locator('[data-era="1"]').click();await holdUntil(page,'d',()=>Number(document.querySelector('#device-stage').dataset.playerX)>7.2);await expect(page.locator('body')).toHaveAttribute('data-era','desktop');
});

test('theme changes the whole page, preserves the journey and survives reload',async({page})=>{
 await page.emulateMedia({colorScheme:'light'});await ready(page);
 await page.locator('[data-era="2"]').click();await page.locator('#device-stage canvas').focus();await holdUntil(page,'d',()=>Number(document.querySelector('#device-stage').dataset.playerX)>7);
 const x=await page.locator('#device-stage').getAttribute('data-player-x');
 await page.getByRole('button',{name:'Switch to dark mode'}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await expect(page.locator('body')).toHaveCSS('background-color','rgb(23, 24, 34)');
 await expect(page.locator('body')).toHaveAttribute('data-era','flip');await expect(page.locator('#device-stage')).toHaveAttribute('data-player-x',x);
 await page.locator('[data-content="about"]').click();await expect(page.locator('dialog')).toHaveCSS('background-color','rgb(36, 35, 47)');await page.keyboard.press('Escape');
 await page.reload();await expect(page.getByRole('button',{name:'Switch to light mode'})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Switch to light mode'}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});

test('theme follows system preference until chosen, and works with storage blocked',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('Storage disabled');};Storage.prototype.setItem=()=>{throw new Error('Storage disabled');};});
 await page.emulateMedia({colorScheme:'dark'});await ready(page);await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.getByRole('button',{name:'Switch to dark mode'}).click();await page.emulateMedia({colorScheme:'dark'});await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
});

test('reduced motion keeps the device still when the mouse moves',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await ready(page);const canvas=page.locator('#device-stage canvas');
 const before=await canvas.screenshot();const r=await canvas.boundingBox();await page.mouse.move(r.x+r.width*.9,r.y+r.height*.2);await page.waitForTimeout(300);
 expect((await canvas.screenshot()).equals(before)).toBe(true);
});

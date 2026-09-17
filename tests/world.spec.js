import { test, expect } from '@playwright/test';
const ids=['about','systems','omniii','keynotes','resources','connect'];
async function ready(page){await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-world-ready','true');}
async function open(page,id){await page.locator(`[data-destination="${id}"]`).click();await expect(page.locator('#detail')).toBeVisible();}

test('all islands, collection, completion, persistence, reset and real content',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await ready(page);
  for(const id of ids){await open(page,id);await expect(page.locator('#detail-content h2')).not.toBeEmpty();await page.locator('#collect').click();await expect(page.locator('#collect')).toBeDisabled();if(id==='systems'){await expect(page.locator('.content-card')).toHaveCount(8);await expect(page.getByRole('link',{name:'Meet FormWright'})).toHaveAttribute('href','formwright.html');}await page.getByRole('button',{name:'Close destination'}).click();}
  await expect(page.locator('#quest-count')).toHaveText('6/6');await page.reload();await expect(page.locator('#quest-count')).toHaveText('6/6');await page.locator('#journal').click();await expect(page.locator('#detail-title')).toHaveText('You don’t need an invitation.');await expect(page.locator('.journal-list li')).toHaveCount(6);await page.locator('#reset-progress').click();await expect(page.locator('#quest-count')).toHaveText('0/6');expect(errors).toEqual([]);
});

for(const [name,width,height] of [['phone',390,844],['small-phone',320,568],['phone-landscape',844,390],['tablet',768,1024],['foldable',720,960],['laptop',1440,900]]){
  test(`${name}: visible, reachable islands and orientation changes`,async({page})=>{
    await page.setViewportSize({width,height});await ready(page);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    for(const id of ids){const b=page.locator(`[data-island="${id}"]`);await b.scrollIntoViewIfNeeded();await expect(b).toBeInViewport();await b.click();await expect(page.locator('#detail')).toBeVisible();await page.locator('#close-detail').click();}
    await page.setViewportSize({width:height,height:width});await open(page,'resources');await expect(page.getByRole('link',{name:'Listen to the podcast'})).toBeVisible();await page.locator('#close-detail').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
}

test('keyboard navigation, modal focus trapping and Escape return',async({page})=>{
  await ready(page);await page.locator('[data-destination="about"]').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('[data-destination="systems"]')).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('#detail')).toBeVisible();await expect(page.locator('#close-detail')).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(page.locator('#next-island')).toBeFocused();await page.keyboard.press('Escape');await expect(page.locator('#detail')).not.toBeVisible();await expect(page.locator('[data-destination="systems"]')).toBeFocused();
});

test('reduced motion and paused world keep navigation usable',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await ready(page);await expect(page.locator('#motion')).toHaveAttribute('aria-pressed','true');await open(page,'omniii');await page.locator('#close-detail').click();await page.locator('#motion').click();await expect(page.locator('#motion')).toHaveAttribute('aria-pressed','false');
});

test('3D import failure preserves all content',async({page})=>{
  await page.route('**/world.js',route=>route.abort());await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-world-ready','fallback');await page.locator('[data-island="connect"]').click();await expect(page.locator('#detail')).toBeVisible();await expect(page.getByRole('link',{name:'Start a conversation'})).toHaveAttribute('href','https://forms.gle/QVLGQnNdkHDoeVA77');
});

test('storage failures and malformed values never block exploring',async({page})=>{
  await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage denied','SecurityError')}});});await ready(page);await open(page,'about');await page.locator('#collect').click();await expect(page.locator('#quest-count')).toHaveText('1/6');
});

test('no JavaScript retains a clear route to the full portfolio',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:4173');await expect(page.locator('noscript a')).toHaveAttribute('href','classic.html');await context.close();
});

test('orbit controls, touch selection and existing pages',async({browser,request})=>{
  const context=await browser.newContext({hasTouch:true,viewport:{width:390,height:844}});const page=await context.newPage();await ready(page);await page.locator('#rotate-right').tap();await page.locator('#reset-view').tap();await page.locator('[data-island="about"]').tap();await expect(page.locator('#detail')).toBeVisible();await context.close();
  for(const path of ['/classic.html','/formwright.html','/phantom-grid.html','/omniii-support.html','/omniii-privacy.html','/omniii-terms.html'])expect((await request.get(path)).ok()).toBe(true);
});

test('legacy section bookmarks open their content',async({page})=>{
  await page.goto('/#podcast');await expect(page.locator('#detail')).toBeVisible();await expect(page.getByRole('link',{name:'Listen to the podcast'})).toHaveAttribute('href','https://open.spotify.com/show/3B9nZzv9zfdGlHMMvDKcdb');
});

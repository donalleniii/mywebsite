import {test,expect} from '@playwright/test';
async function ready(page){await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-ready','true');}

test('studio shelf opens the original video collection and falls back from missing thumbnail sizes',async({page})=>{
 await page.route('https://img.youtube.com/**',route=>route.fulfill({contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="${route.request().url().includes('maxres')?120:480}" height="270"><rect width="100%" height="100%" fill="purple"/></svg>`}));
 await ready(page);await page.locator('[data-studio="keynotes"]').click();await expect(page.locator('.video-gallery .video-poster')).toHaveCount(3);
 for(const img of await page.locator('.video-gallery img').all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate(el=>el.naturalWidth)).toBe(480);await expect(img).toHaveAttribute('src',/hqdefault.jpg$/);}
 await expect(page.locator('.video-gallery .video-poster').nth(1)).toHaveAttribute('href','https://www.youtube.com/watch?v=Ja-MTe1VkfM&t=695s');
 await expect(page.locator('.video-gallery .video-poster').nth(2)).toHaveAttribute('href','https://www.youtube.com/watch?v=ObUBUKOn-bo');
 await page.locator('#close-detail').click();await expect(page.locator('[data-studio="keynotes"]')).toBeFocused();
});

test('unavailable remote thumbnails retain readable posters and working video links',async({page})=>{
 await page.route('https://img.youtube.com/**',r=>r.abort());await ready(page);await page.locator('[data-studio="keynotes"]').click();
 const poster=page.locator('.video-gallery .video-poster').first();await poster.scrollIntoViewIfNeeded();await expect(poster).toHaveClass(/media-unavailable/);await expect(poster.locator('img')).toBeHidden();await expect(poster).toHaveAttribute('href','https://www.youtube.com/watch?v=yaeazIA5np8');
});

test('project gallery retains all tools, draws previews, and respects reduced motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await ready(page);await page.locator('[data-studio="systems"]').click();
 await expect(page.locator('.project-gallery .content-card')).toHaveCount(8);await expect(page.getByRole('link',{name:'Meet FormWright',exact:false})).toHaveAttribute('href','formwright.html');
 const preview=page.locator('canvas[data-preview="glyph"]');await preview.scrollIntoViewIfNeeded();const before=await preview.evaluate(el=>el.toDataURL());await page.waitForTimeout(250);expect(await preview.evaluate(el=>el.toDataURL())).toBe(before);
 await page.locator('[data-read="connect"]').click();await expect(page.locator('canvas[data-preview]')).toHaveCount(0);
});

test('all advisor and collaborator names appear on phone and book pages',async({page})=>{
 await page.setViewportSize({width:390,height:844});await ready(page);await page.locator('[data-era="5"]').click();await page.locator('[data-studio="connect"]').click();
 await expect(page.locator('.collaborator-stamps li')).toHaveCount(19);await expect(page.locator('.collaborator-stamps')).toContainText('Warner Music Group');await expect(page.locator('.collaborator-stamps')).toContainText('Asteria');
 await page.locator('.collaborator-stamps').scrollIntoViewIfNeeded();expect(await page.locator('#reader-scroll').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
 await page.locator('[data-read="about"]').click();await expect(page.locator('.collaborator-stamps li')).toHaveCount(19);await page.locator('#close-detail').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {eras} from '../assets/world/device-data.js';
const tags=['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'];
async function scan(page){
 if(await page.locator('#detail').isVisible()){
  const colors=await page.locator('#detail').evaluate(root=>{const ink=getComputedStyle(root).color;return [...root.querySelectorAll('.body-copy,.card-copy>p,.card-copy>small,.content-card:not(.has-media)>p,.content-card:not(.has-media)>small')].filter(el=>getComputedStyle(el).color!==ink).map(el=>({element:el.className||el.tagName,color:getComputedStyle(el).color,expected:ink}));});
  expect(colors,'Device reading text must retain its own ink in either studio theme').toEqual([]);
 }
 const result=await new AxeBuilder({page}).withTags(tags).analyze();expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,reason:n.failureSummary}))}))).toEqual([]);}
async function ready(page,theme='light'){await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-ready','true');}
for(const theme of ['light','dark']){
 test(`${theme}: home and all nine device reading palettes meet automated WCAG AA checks`,async({page,browserName})=>{
  test.skip(browserName!=='chromium','Axe matrix runs once; interaction/reflow tests cover both engines.');test.setTimeout(240000);await ready(page,theme);await scan(page);
  for(let i=0;i<eras.length;i++){
   await page.locator(`[data-era="${i}"]`).click();
   await page.locator('[data-content="about"]').click();await expect(page.locator('[data-reader-ready="true"]')).toBeVisible();
   for(const section of ['about','systems','formwright','omniii','keynotes','resources','connect']){
    await page.locator(`[data-read="${section}"]`).click();await scan(page);
   }
   await page.locator('#close-detail').click();
   if(['blocks','shore'].includes(eras[i].id)){await page.locator('#object-action').click();await expect(page.locator('.workshop-scene canvas')).toBeVisible();await scan(page);await page.locator('#close-detail').click();}
  }
 });
}
const luminance=hex=>hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
test('canvas labels and device reader palettes exceed normal-text AA contrast',()=>{
 for(const era of eras){const a=luminance(era.screen),b=luminance(era.ink);expect((Math.max(a,b)+.05)/(Math.min(a,b)+.05),era.id).toBeGreaterThanOrEqual(4.5);}
});
for(const [name,width,height] of [['320px reflow',320,700],['200% desktop equivalent',720,500],['phone landscape',844,390]]){
 test(`${name}: readable content reflows and keyboard exit remains available`,async({page})=>{
  await page.setViewportSize({width,height});await ready(page,'dark');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('[data-content="systems"]').click();await expect(page.locator('[data-reader-ready="true"]')).toBeVisible();
  await expect(page.locator('#close-detail')).toBeFocused();
  expect(await page.locator('#reader-scroll').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  await page.locator('#reader-scroll').focus();await page.keyboard.press('End');
  await expect(page.locator('#back-to-device')).toBeInViewport();
  await page.keyboard.press('Escape');await expect(page.locator('#detail')).toBeHidden();await expect(page.locator('[data-content="systems"]')).toBeFocused();
 });
}

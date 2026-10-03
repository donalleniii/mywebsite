import { chromium } from 'playwright';
const W = +(process.argv[2]||1920), H = +(process.argv[3]||1080);
const times = process.argv.slice(4).map(Number);
const browser = await chromium.launch({ args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl'] });
const page = await browser.newPage({ viewport:{ width:W, height:H } });
page.on('console', m=>console.log('console:', m.text()));
page.on('pageerror', e=>console.log('pageerror:', e.message));
await page.goto(`http://localhost:8765/tools/intro-video/intro.html?w=${W}&h=${H}`);
await page.waitForFunction(()=>window.READY===true, null, {timeout:120000});
for (const t of times){
  await page.evaluate(t=>new Promise(r=>{ window.renderFrame(t); requestAnimationFrame(()=>requestAnimationFrame(r)); }), t);
  await page.screenshot({ path:`still_${W}x${H}_${t}.jpg`, type:'jpeg', quality:85 });
  console.log('shot', t);
}
await browser.close();

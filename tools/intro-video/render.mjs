import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const W = +process.argv[2], H = +process.argv[3], out = process.argv[4];
const FPS = 30;
const browser = await chromium.launch({ args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport:{ width:W, height:H } });
page.on('pageerror', e=>console.log('pageerror:', e.message));
await page.goto(`http://localhost:8765/tools/intro-video/intro.html?w=${W}&h=${H}`);
await page.waitForFunction(()=>window.READY===true, null, {timeout:120000});
const D = await page.evaluate(()=>window.DURATION);
const N = Math.round(D*FPS);
const ff = spawn('ffmpeg', ['-y','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-c:v','png','-i','-',
  '-c:v','libx264','-preset','slow','-crf','10','-pix_fmt','yuv420p','-r',String(FPS), out], { stdio:['pipe','inherit','inherit'] });
const t0 = Date.now();
for (let f=0; f<N; f++){
  const t = f/FPS;
  await page.evaluate(t=>new Promise(r=>{ window.renderFrame(t); requestAnimationFrame(()=>requestAnimationFrame(r)); }), t);
  const buf = await page.screenshot({ type:'png' });
  if (!ff.stdin.write(buf)) await new Promise(r=>ff.stdin.once('drain', r));
  if (f%60===0) console.log(`frame ${f}/${N} ${(Date.now()-t0)/1000}s`);
}
ff.stdin.end();
await new Promise(r=>ff.on('close', r));
await browser.close();
console.log('done', out, (Date.now()-t0)/1000+'s');

import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests',fullyParallel:true,workers:3,timeout:30000,
  use:{baseURL:process.env.PREVIEW_URL||'http://127.0.0.1:4173',headless:true,viewport:{width:1440,height:1000}},
  projects:[
    {name:'chromium',use:{browserName:'chromium',launchOptions:{args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}}},
    {name:'webkit',use:{browserName:'webkit'}}
  ],
  webServer:process.env.PREVIEW_URL?undefined:{command:'npm run dev',url:'http://127.0.0.1:4173',reuseExistingServer:true},
});

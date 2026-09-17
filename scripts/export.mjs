import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const output=resolve(root,'dist');
await mkdir(output,{recursive:true});
for(const file of await readdir(output))if(file!=='.vercel')await rm(resolve(output,file),{recursive:true,force:true});
for(const file of await readdir(root))if(file.endsWith('.html')||file==='_redirects')await cp(resolve(root,file),resolve(output,file));
await cp(resolve(root,'assets'),resolve(output,'assets'),{recursive:true});
// This preview-specific config stays inside the export. The existing Cloudflare
// production configuration and custom domain are intentionally not modified.
await writeFile(resolve(output,'vercel.json'),JSON.stringify({version:2,cleanUrls:true,rewrites:[{source:'/links',destination:'https://comment-to-dm.donallenthethird.workers.dev/links'},{source:'/links/:path*',destination:'https://comment-to-dm.donallenthethird.workers.dev/links/:path*'},{source:'/go/:path*',destination:'https://comment-to-dm.donallenthethird.workers.dev/go/:path*'}]},null,2));
console.log('Static preview exported to dist/');

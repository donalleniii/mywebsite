import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
createServer(async(req,res)=>{
  try{
    let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname==='/links'||pathname.startsWith('/go/')){res.writeHead(302,{Location:`https://donalleniii.me${pathname}`});res.end();return;}
    if(pathname==='/')pathname='/index.html';
    if(pathname==='/formwright')pathname='/formwright.html';
    const file=resolve(root,`.${pathname}`);
    if(!file.startsWith(root+sep)||pathname.split('/').some(p=>p.startsWith('.'))||['node_modules','scripts','tests'].includes(pathname.split('/')[1]))throw new Error('not public');
    if(!(await stat(file)).isFile())throw new Error('not found');
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log('Portfolio ready at http://127.0.0.1:4173'));

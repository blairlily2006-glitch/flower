import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.mp4':'video/mp4','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.wasm':'application/wasm','.task':'application/octet-stream','.css':'text/css; charset=utf-8'};
const server=createServer((req,res)=>{let file;try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);file=normalize(join(root,path==='/'?'index.html':path))}catch{res.writeHead(400).end('Bad request');return}if(!file.startsWith(root)){res.writeHead(403).end('Forbidden');return}try{const{size}=statSync(file);res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');const range=req.headers.range;if(range){const[a,b]=range.replace('bytes=','').split('-'),start=Number(a),end=b?Math.min(Number(b),size-1):size-1;if(start>=size||end<start){res.writeHead(416,{'Content-Range':`bytes */${size}`}).end();return}res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});createReadStream(file,{start,end}).pipe(res)}else{res.writeHead(200,{'Content-Length':size});createReadStream(file).pipe(res)}}catch{res.writeHead(404).end('Not found')}});
const port=Number(process.env.PORT||4173);server.listen(port,'127.0.0.1',()=>console.log(`Flora is ready at http://localhost:${port}`));

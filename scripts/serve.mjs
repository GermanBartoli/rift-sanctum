import {onRequestGet as jugador} from '../functions/api/player.js';
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve("public");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
};
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const rutas = {'/api/player':jugador};
    if (Object.hasOwn(rutas,url.pathname)) {
      if (req.method !== 'GET') { res.writeHead(405).end(); return; }
      const resultado = await rutas[url.pathname]({desarrolloLocal:true,request:new Request(url),env:{RIOT_API_KEY:process.env.RIOT_API_KEY}});
      res.writeHead(resultado.status,Object.fromEntries(resultado.headers));
      res.end(await resultado.text());
      return;
    }
    const path = resolve(
      root,
      "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (path !== root && !path.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    const file = path === root ? resolve(root, "index.html") : path;
    res.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end("No encontrado");
  }
}).listen(Number(process.env.PORT || 4173), '127.0.0.1', function () {console.log('http://127.0.0.1:'+this.address().port);});

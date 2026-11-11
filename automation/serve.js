// Tiny static server for the demo page (content scripts need http://, not file://).
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../demo');

export function startServer(port = 5173) {
  const server = http.createServer(async (req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': file.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('Not found');
    }
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 5173;
  await startServer(port);
  console.log(`Demo quiz: http://localhost:${port}`);
}

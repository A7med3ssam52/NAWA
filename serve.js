import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createGzip } from 'node:zlib';

const dist = new URL('./dist', import.meta.url).pathname;
const port = 5173;
const mimes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};
const cacheExts = new Set(['.js', '.css', '.png', '.svg', '.ico']);

createServer((req, res) => {
  try {
    let path = req.url === '/' ? '/index.html' : req.url;
    let file = join(dist, path);
    if (!existsSync(file)) file = join(dist, 'index.html');
    const ext = extname(file);
    const content = readFileSync(file);
    const headers = { 'Content-Type': mimes[ext] || 'application/octet-stream' };
    if (ext === '.html') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    } else if (cacheExts.has(ext)) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    }
    const accept = req.headers['accept-encoding'] || '';
    if (/\bgzip\b/.test(accept) && content.length > 1024) {
      headers['Content-Encoding'] = 'gzip';
      const gzipped = createGzip();
      gzipped.end(content);
      const chunks = [];
      gzipped.on('data', (c) => chunks.push(c));
      gzipped.on('end', () => {
        res.writeHead(200, headers);
        res.end(Buffer.concat(chunks));
      });
      return;
    }
    res.writeHead(200, headers);
    res.end(content);
  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
}).listen(port, () => console.log(`Server: http://localhost:${port}`));

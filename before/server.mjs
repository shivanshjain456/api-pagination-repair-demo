import http from 'node:http';
import { pathToFileURL } from 'node:url';
const products = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `Demo product ${i + 1}` }));
const pageSize = 4;
export function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname !== '/api/products') {
      res.writeHead(404, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Not found' }));
    }
    const rawPage = url.searchParams.get('page') ?? '1';
    if (!/^[1-9]\d*$/.test(rawPage) || !Number.isSafeInteger(Number(rawPage))) {
      res.writeHead(400, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ error: 'page must be a positive safe integer' }));
    }
    const page = rawPage; // BUG: URL query parameters are strings.
    const totalPages = Math.ceil(products.length / pageSize);
    const items = products.slice((page - 1) * pageSize, page * pageSize);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ items, page, totalPages, nextPage: page < totalPages ? page + 1 : null }));
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 3000);
  createServer().listen(port, '127.0.0.1', () => console.log(`Demo API: http://127.0.0.1:${port}/api/products?page=1`));
}

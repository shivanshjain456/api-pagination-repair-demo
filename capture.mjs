import { writeFile } from 'node:fs/promises';
const results = {};
for (const variant of ['before', 'after']) {
  const { createServer } = await import(`./${variant}/server.mjs`);
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const first = await (await fetch(`${base}/api/products?page=1`)).json();
  const next = await (await fetch(`${base}/api/products?page=${first.nextPage}`)).json();
  results[variant] = { first, next };
  await new Promise(resolve => server.close(resolve));
}
await writeFile(new URL('./evidence/http-responses.json', import.meta.url), JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));

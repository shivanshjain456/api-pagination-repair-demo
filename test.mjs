import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
const variant = process.env.VARIANT ?? 'after';
if (!['before', 'after'].includes(variant)) throw new Error('VARIANT must be before or after');
const { createServer } = await import(`./${variant}/server.mjs`);
let server, base;
before(async () => {
  server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise(resolve => server.close(resolve)); });
async function get(query = '') {
  const response = await fetch(`${base}/api/products${query}`);
  return { status: response.status, body: await response.json() };
}
test('Next from page 1 must be page 2, not page 11', async () => {
  const { status, body } = await get('?page=1');
  assert.equal(status, 200);
  assert.equal(body.nextPage, 2);
});
test('Following Next retrieves every product once without skipping pages', async () => {
  let page = 1;
  const ids = [];
  for (let guard = 0; page !== null && guard < 10; guard++) {
    const { body } = await get(`?page=${page}`);
    ids.push(...body.items.map(item => item.id));
    page = body.nextPage;
  }
  assert.equal(page, null, 'pagination must terminate');
  assert.deepEqual(ids, Array.from({ length: 12 }, (_, i) => i + 1));
});
test('Omitted page defaults to numeric page 1', async () => {
  const { body } = await get();
  assert.equal(body.page, 1);
  assert.deepEqual(body.items.map(x => x.id), [1, 2, 3, 4]);
});
test('Last page stops pagination and returns the final four products', async () => {
  const { body } = await get('?page=3');
  assert.equal(body.nextPage, null);
  assert.deepEqual(body.items.map(x => x.id), [9, 10, 11, 12]);
});
test('Out-of-range page returns an empty collection and no next page', async () => {
  const { body } = await get('?page=99');
  assert.deepEqual(body.items, []);
  assert.equal(body.nextPage, null);
});
test('Invalid page values return 400 rather than silently coercing', async () => {
  for (const value of ['', '0', '-1', '1.5', 'abc', '01', '9007199254740992']) {
    assert.equal((await get(`?page=${encodeURIComponent(value)}`)).status, 400, value);
  }
});
test('Unknown route returns 404', async () => {
  assert.equal((await fetch(`${base}/missing`)).status, 404);
});

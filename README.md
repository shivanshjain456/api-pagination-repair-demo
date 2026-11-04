# The Next button skipped eight products

**Self-built demonstration, not client work.** A minimal Node HTTP API reproduces a JavaScript query-parameter defect commonly relevant to web-app repair. All data is synthetic. This example was intentionally constructed with the defect; it is not evidence of an incident in a third-party app.

## Verified result

The same seven HTTP integration checks were run against both snapshots on Node v24.22.1:

- Before: 4 passed, 3 failed; process exit 1.
- After: 7 passed, 0 failed; process exit 0.
- Page 1 returned `nextPage: "11"` before the fix. Following it returned no products, skipping products 5–12.
- After the fix, page 1 returns `nextPage: 2`; traversal retrieves all 12 products once and terminates.

Local absolute paths in stack traces are replaced with `[DEMO_DIR]`; outcomes and assertions are unchanged.

Raw evidence is in `evidence/before-test.txt`, `evidence/after-test.txt`, and `evidence/http-responses.json`. Test durations are run-specific, not delivery-time claims.

## Run it

Requires Node 20 or later and npm. No dependencies, installation, API keys, accounts or network services are required.

```sh
cd api-pagination-repair-demo
VARIANT=before npm test  # expected failure, exit 1
VARIANT=after npm test  # expected success, exit 0
node capture.mjs       # regenerates actual HTTP-response evidence
npm start              # fixed API on 127.0.0.1:3000
```

In another terminal:

```sh
curl 'http://127.0.0.1:3000/api/products?page=1'
```

Stop with Ctrl+C. To inspect the buggy server instead, run `npm run start:before`. Set `PORT=3001` to use a different port. Automated checks use ephemeral ports and close their servers afterward.

## Reproduction and cause

The API serves 12 products in groups of four. A consumer follows the `nextPage` field. URL query parameters are strings. Subtraction and multiplication happen to coerce the string while calculating slice bounds, so page 1 appears correct. But `page + 1` performs string concatenation: `"1" + 1` becomes `"11"`. A cursory check of only the first four products misses the defect.

## Fix

Existing input validation rejects anything other than a positive safe integer representation. After that validation, convert `rawPage` with `Number(rawPage)` before arithmetic. The snapshots differ at exactly that assignment. See `evidence/fix.diff`.

## Regression coverage

1. Page 1 points to numeric page 2.
2. Following Next retrieves all 12 unique products in order and stops.
3. An omitted page defaults to numeric page 1.
4. The last page returns products 9–12 and no next page.
5. A page beyond the collection returns an empty list and no next page.
6. Empty, zero, negative, fractional, nonnumeric, leading-zero, and unsafe-integer page inputs return 400.
7. An unknown path returns 404.

These use real loopback HTTP requests, not mocked request objects. The tests and data are identical in both runs.

## Limits

This is a deliberately small API example, not a production-ready store or a React UI. It does not establish browser behavior, performance, database integrity, authentication, deployment readiness, or any client business outcome. No claims are made about revenue, client results, universal repair success, or a guaranteed repair timeline. The API only demonstrates this one fixed defect. Node versions other than v24.22.1 were not tested in this run.


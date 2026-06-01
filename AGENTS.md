# jsoncargo Node.js SDK — Agent Instructions

TypeScript SDK for a container and vessel tracking API. Dual CJS + ESM build targeting Node.js 18+.

## Setup

```bash
npm install
```

## Build

```bash
npm run build        # all outputs
npm run build:esm    # dist/esm/  (ESM, NodeNext)
npm run build:cjs    # dist/cjs/  (CommonJS)
npm run build:types  # dist/types/ (declarations)
```

## Test

```bash
npm test
```

Tests use Jest with `ts-jest` in ESM mode. All tests mock `global.fetch` — no live network calls.

## Project structure

```
src/
  client.ts       # Client class, _get(), stats()
  containers.ts   # track(), fromBol()
  vessels.ts      # basic(), pro(), bulk(), finder(), specs()
  ports.ts        # find()
  terminals.ts    # find()
  models.ts       # TypeScript interfaces for all API response shapes
  errors.ts       # JSONCargoError hierarchy
  index.ts        # Public re-exports
tests/
  client.test.ts
```

## Key conventions

- **Auth**: API key goes in the `x-api-key` request header. Use the `JSONCARGO_API_KEY` environment variable for manual testing — never hardcode keys.
- **Validation**:
  - Container number must match `^[A-Z]{4}\d{7}$`
  - BOL must not contain `/\%#?&+`, null bytes, or `..`
  - Shipping line must be one of the 11 known values in `VALID_SHIPPING_LINES`
  - API key is a non-empty string check only
- **Error hierarchy**: `JSONCargoError` → `AuthenticationError` (401/403), `NotFoundError` (404), `RateLimitError` (429), `APIError` (all others; carries `statusCode`)
- `AuthenticationError`, `NotFoundError`, and `RateLimitError` also carry a `statusCode` property
- **Response unwrapping**: all successful responses are `{"data": {...}}`; the SDK returns the inner object only
- **Timeout**: default 30 s via `AbortController`; override via `ClientOptions.timeout`

## Publishing

Tag a release `v0.x.x` to trigger the publish workflow. Requires `NPM_TOKEN` repo secret.

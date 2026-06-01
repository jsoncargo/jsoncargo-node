# jsoncargo Node.js SDK

TypeScript SDK for the container and vessel tracking API. Dual CJS + ESM build.

## Requirements

- Node.js 18+ (uses native `fetch`)
- npm 9+

## Setup

```bash
npm install
```

## Build

```bash
npm run build        # all three outputs
npm run build:esm    # dist/esm/ (ESM, NodeNext modules)
npm run build:cjs    # dist/cjs/ (CommonJS, writes dist/cjs/package.json with type=commonjs)
npm run build:types  # dist/types/ (declarations only)
```

## Test

```bash
npm test
```

Tests use Jest with `ts-jest` in ESM mode. All tests mock `global.fetch` via `jest.spyOn`; no live network calls are made.

## Project structure

```
src/
  client.ts       # Client class, _get(), stats()
  containers.ts   # track(), fromBol() — container tracking resource
  vessels.ts      # basic(), pro(), bulk(), finder(), specs() — vessel resource
  ports.ts        # find() — port resource
  terminals.ts    # find() — terminal resource
  models.ts       # TypeScript interfaces for all API response shapes
  errors.ts       # JSONCargoError hierarchy
  index.ts        # Public re-exports
tests/
  client.test.ts
```

## Key conventions

- **Auth**: API key goes in `x-api-key` request header; never hardcoded — use `JSONCARGO_API_KEY` env var for manual testing.
- **Validation**: container number must match `^[A-Z]{4}\d{7}$`; BOL must not contain `/\%#?&+` null bytes or `..`; shipping line must be one of the 11 known values; API key is a non-empty string check only (no format regex).
- **Error hierarchy**: `JSONCargoError` → `AuthenticationError` (401/403), `NotFoundError` (404), `RateLimitError` (429), `APIError` (everything else, carries `statusCode`).
- **Response unwrapping**: all successful responses are `{"data": {...}}`; the SDK returns the inner object only.
- **Timeout**: default 30 s via `AbortController`; override via `ClientOptions.timeout`.

## Publishing

Tag a release `v0.x.x` to trigger the publish workflow. Requires `NPM_TOKEN` repo secret.

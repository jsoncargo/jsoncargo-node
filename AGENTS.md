# jsoncargo Node.js SDK

TypeScript SDK for container and vessel tracking. Requires Node.js 18+.

## Installation

```bash
npm install jsoncargo
```

## Initializing the client

```ts
import { Client } from 'jsoncargo';

const client = new Client(process.env.JSONCARGO_API_KEY);
```

The API key is passed as the first argument. Never hardcode keys — use the `JSONCARGO_API_KEY` environment variable.

Optional second argument:

```ts
new Client(apiKey, {
  timeout: 10000,   // request timeout in ms (default: 30 000)
  baseUrl: '...',   // override the API base URL
});
```

## Resources

### `client.containers`

```ts
// Track a container by number + shipping line
const container = await client.containers.track('MSCU1234567', 'MSC');

// Look up containers by bill of lading
const bol = await client.containers.fromBol('BOLNUMBER', 'MAERSK');
```

### `client.vessels`

All vessel methods accept a `VesselLookupParams` object. At least one of `uuid`, `mmsi`, or `imo` is required.

```ts
await client.vessels.basic({ mmsi: '123456789' });   // basic position + identity
await client.vessels.pro({ imo: '9876543' });         // extended position + voyage
await client.vessels.bulk({ mmsi: '123456789' });     // paginated vessel list
await client.vessels.specs({ uuid: 'abc-123' });      // static particulars
```

`finder` searches by name and attribute filters. At least one search parameter is required (pagination params `page`, `limit`, `next` do not count).

```ts
await client.vessels.finder({ name: 'Ever Given', type: 'cargo' });
```

### `client.ports`

At least one search parameter required (`page` and `limit` alone are not sufficient).

```ts
await client.ports.find({ name: 'Rotterdam', country_iso: 'NL' });
await client.ports.find({ lat: 51.9, lon: 4.5, radius: 50 });
```

### `client.terminals`

`unlocode` is required (minimum 2 characters).

```ts
await client.terminals.find({ unlocode: 'NLRTM' });
```

### `client.stats()`

Returns plan and usage counters for the API key.

```ts
const stats = await client.stats();
// { plan, requests_total, requests_made, requests_available }
```

## Validation

Errors are thrown **before** any network call when input is invalid.

| Input | Rule |
|-------|------|
| Container number | `^[A-Z]{4}\d{7}$` — 4 uppercase letters then 7 digits (e.g. `MSCU1234567`) |
| Bill of lading | Must not contain `/`, `\`, `%`, `#`, `?`, `&`, `+`, null bytes, or `..` |
| Shipping line | Must be one of the 11 values below |
| Vessel lookup | At least one of `uuid`, `mmsi`, `imo` |
| Vessel/port finder | At least one non-pagination search parameter |
| Terminal | `unlocode` present and ≥ 2 characters |

Valid shipping lines: `MAERSK`, `HAPAG_LLOYD`, `HMM`, `ONE`, `EVERGREEN`, `MSC`, `CMA_CGM`, `COSCO`, `ZIM`, `YANG_MING`, `PIL`

## Errors

All errors extend `JSONCargoError` and are importable from the package root.

| Class | Trigger |
|-------|---------|
| `JSONCargoError` | Local validation failure (thrown before any HTTP call) |
| `AuthenticationError` | HTTP 401 or 403 — invalid or unauthorized key |
| `NotFoundError` | HTTP 404 — resource not found |
| `RateLimitError` | HTTP 429 — rate limit exceeded |
| `APIError` | Any other HTTP error; carries `.statusCode` |

`AuthenticationError`, `NotFoundError`, and `RateLimitError` also carry a `.statusCode` property.

```ts
import { JSONCargoError, AuthenticationError, RateLimitError } from 'jsoncargo';

try {
  await client.containers.track('MSCU1234567', 'MSC');
} catch (err) {
  if (err instanceof RateLimitError) { /* back off */ }
  if (err instanceof AuthenticationError) { /* check key */ }
  if (err instanceof JSONCargoError) { /* validation or other SDK error */ }
}
```

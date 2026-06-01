# Container Tracking Node SDK

The official Node.js / TypeScript SDK for the jsoncargo API. Track containers, look up vessels, and search ports and terminals from a single typed client.

[![npm version](https://img.shields.io/npm/v/jsoncargo)](https://www.npmjs.com/package/jsoncargo)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js 18+](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

---

## What is jsoncargo?

**jsoncargo** is a container tracking Node SDK that gives you real-time visibility into global container shipments. With a single API key you can:

- **Track containers** by container number across 11 major shipping lines
- **Look up Bills of Lading** to see all containers on a booking
- **Monitor vessels** with live position, voyage detail, and static specs
- **Find ports and terminals** by name, location, or UN/LOCODE

Built for Node.js 18+ with full TypeScript support. Zero runtime dependencies.

---

## Installation

```bash
npm install jsoncargo
```

---

## Quick Start

```ts
import { Client } from 'jsoncargo';

const client = new Client(process.env.JSONCARGO_API_KEY!);

// Track a container
const container = await client.containers.track('MSCU1234567', 'MSC');
console.log(container.container_status);   // "In Transit"
console.log(container.eta_final_destination);

// Look up a Bill of Lading
const bol = await client.containers.fromBol('SELM60819800', 'HMM');
console.log(bol.associated_container_numbers);

// Get a vessel's live position
const vessel = await client.vessels.basic({ mmsi: '353136000' });
console.log(vessel.name, vessel.lat, vessel.lon);
```

---

## Authentication

Generate an API key at [jsoncargo.com](https://jsoncargo.com). Pass it to the `Client` constructor or set it as an environment variable:

```bash
export JSONCARGO_API_KEY=your_api_key_here
```

```ts
const client = new Client(process.env.JSONCARGO_API_KEY!);
```

The key is sent as the `x-api-key` request header on every call. Never hardcode keys in source files.

---

## Container Tracking

### Track by container number

```ts
const container = await client.containers.track(
  'MSCU1234567', // ISO 6346: 4 uppercase letters + 7 digits
  'MSC'
);
```

**Supported shipping lines:** `MAERSK` `MSC` `CMA_CGM` `HAPAG_LLOYD` `COSCO` `EVERGREEN` `ONE` `HMM` `ZIM` `YANG_MING` `PIL`

### Track by Bill of Lading

```ts
const result = await client.containers.fromBol('SELM60819800', 'HMM');
// result.associated_container_numbers → ['HMMU1234567', ...]
```

---

## Vessel Tracking

### Live position (basic)

```ts
const vessel = await client.vessels.basic({ mmsi: '353136000' });
// or by IMO:  { imo: '9811000' }
// or by UUID: { uuid: 'abc123' }
```

### Extended voyage data (pro)

```ts
const vessel = await client.vessels.pro({ imo: '9811000' });
console.log(vessel.dest_port, vessel.atd_UTC);
```

### Bulk lookup

```ts
const { total, vessels } = await client.vessels.bulk({ imo: '9811000' });
```

### Vessel finder, search by name and attributes

```ts
const results = await client.vessels.finder({
  name: 'EVER GIVEN',
  type: 'Cargo',
  gross_tonnage_min: 100000,
});
```

### Static specs

```ts
const specs = await client.vessels.specs({ uuid: 'abc123' });
console.log(specs.length, specs.deadweight, specs.year_built);
```

---

## Ports

```ts
// Search by name
const ports = await client.ports.find({ name: 'Rotterdam' });

// Search by proximity (lat/lon radius in km)
const nearby = await client.ports.find({ lat: 51.9, lon: 4.5, radius: 50 });
```

---

## Terminals

```ts
// Find terminals at a port by UN/LOCODE
const terminals = await client.terminals.find({ unlocode: 'NLRTM' });
console.log(terminals[0].terminal_name);
```

---

## API Key Stats

```ts
const stats = await client.stats();
console.log(`${stats.requests_made} / ${stats.requests_total} requests used`);
```

---

## Error Handling

All errors extend `JSONCargoError`. Catch specific subclasses to handle each case:

```ts
import {
  JSONCargoError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  APIError,
} from 'jsoncargo';

try {
  const container = await client.containers.track('MSCU1234567', 'MSC');
} catch (err) {
  if (err instanceof AuthenticationError) {
    // 401: invalid key, 403: key lacks permission for this endpoint
    console.error(err.message, err.statusCode);
  } else if (err instanceof NotFoundError) {
    // 404: container not found
  } else if (err instanceof RateLimitError) {
    // 429: slow down
  } else if (err instanceof APIError) {
    // other HTTP or network error; err.statusCode may be set
    console.error(err.statusCode, err.message);
  }
}
```

---

## Configuration

```ts
const client = new Client(apiKey, {
  timeout: 10_000,                        // ms (default: 30 000)
  baseUrl: 'https://api.jsoncargo.com',   // override for testing
});
```

---

## TypeScript

The SDK is written in TypeScript and ships its own types, no `@types/` package needed.

```ts
import type {
  Container,
  BolResult,
  VesselBasic,
  VesselPro,
  VesselStatic,
  Port,
  Terminal,
  ApiKeyStats,
  ShippingLine,
} from 'jsoncargo';
```

CommonJS and ESM are both supported:

```js
// ESM
import { Client } from 'jsoncargo';

// CommonJS
const { Client } = require('jsoncargo');
```

---

## License

MIT © [jsoncargo](https://jsoncargo.com)

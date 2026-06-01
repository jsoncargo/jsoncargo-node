import * as http from 'http';
import {
  Client,
  APIError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  JSONCargoError,
  DEFAULT_TIMEOUT,
} from '../src/index';

function mockResponse(body: unknown, status = 200): Response {
  return {
    ok: status < 400,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => body,
  } as Response;
}

function nonJsonResponse(status = 200): Response {
  return {
    ok: status < 400,
    status,
    statusText: 'OK',
    json: async () => {
      throw new SyntaxError('Unexpected token');
    },
  } as Response;
}

const MOCK_CONTAINER = {
  data: {
    container_id: 'MSCU1234567',
    container_type: "40' HIGH CUBE",
    container_status: 'In Transit',
    shipping_line_name: 'Mediterranean Shipping Company',
    shipping_line_id: '0015',
    tare: 3900,
    shipped_from: 'SHANGHAI, CN',
    eta_final_destination: '2024-08-01 00:00',
    bill_of_lading: 'MSCUBL123456',
    last_updated: '2024-07-10 18:00',
  },
};

const MOCK_BOL = {
  data: {
    bill_of_lading: 'SELM60819800',
    shipping_line_name: 'Hyundai Merchant Marine',
    shipping_line_id: '0012',
    associated_containers: 3,
    associated_container_numbers: ['HMMU1234567', 'HMMU7654321', 'KOCU1234567'],
    last_updated: '2025-03-28 04:09',
  },
};

let fetchSpy: jest.SpyInstance;

function stubFetch(impl: () => Promise<Response>): void {
  fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(impl);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Client construction', () => {
  // 1
  test('rejects empty API key', () => {
    expect(() => new Client('')).toThrow(JSONCargoError);
  });

  // 26
  test('default timeout is 30000ms', () => {
    expect(DEFAULT_TIMEOUT).toBe(30000);
  });

  // 27
  test('custom timeout option accepted', async () => {
    stubFetch(async () => mockResponse(MOCK_CONTAINER));
    const client = new Client('k', { timeout: 5000 });
    await client.containers.track('MSCU1234567', 'MSC');
    expect(fetchSpy).toHaveBeenCalled();
  });
});

describe('Containers', () => {
  let client: Client;
  beforeEach(() => {
    client = new Client('test_key');
  });

  // 2
  test('track returns mapped Container', async () => {
    stubFetch(async () => mockResponse(MOCK_CONTAINER));
    const c = await client.containers.track('MSCU1234567', 'MSC');
    expect(c.container_id).toBe('MSCU1234567');
    expect(c.container_status).toBe('In Transit');
    expect(c.tare).toBe(3900);
    expect(c.bill_of_lading).toBe('MSCUBL123456');
  });

  test('track sends correct path, header and shipping_line param', async () => {
    stubFetch(async () => mockResponse(MOCK_CONTAINER));
    await client.containers.track('MSCU1234567', 'MAERSK');
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain('/containers/MSCU1234567');
    expect(String(url)).toContain('shipping_line=MAERSK');
    expect((init as RequestInit).method).toBe('GET');
    expect((init as RequestInit).headers).toMatchObject({
      'x-api-key': 'test_key',
    });
  });

  // 3
  test.each(['invalid', 'ABCD123456', 'abcd1234567'])(
    'track rejects malformed container number %s',
    async (bad) => {
      await expect(client.containers.track(bad, 'MSC')).rejects.toThrow(
        /Invalid container number/
      );
    }
  );

  // 28
  test('track rejects path traversal in container number', async () => {
    await expect(
      client.containers.track('../../../etc', 'MSC')
    ).rejects.toThrow(/Invalid container number/);
  });

  // 4
  test('track rejects unknown shipping_line', async () => {
    await expect(
      client.containers.track('MSCU1234567', 'FAKE' as never)
    ).rejects.toThrow(/Invalid shipping_line/);
  });

  // 5
  test('track rejects empty shipping_line', async () => {
    await expect(
      client.containers.track('MSCU1234567', '' as never)
    ).rejects.toThrow(/shipping_line is required/);
  });

  test('fromBol sends correct path and params', async () => {
    stubFetch(async () => mockResponse(MOCK_BOL));
    await client.containers.fromBol('SELM60819800', 'HMM');
    const [url] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain('/containers/bol/SELM60819800');
    expect(String(url)).toContain('shipping_line=HMM');
  });

  // 2 (BOL mapping)
  test('fromBol returns mapped BolResult', async () => {
    stubFetch(async () => mockResponse(MOCK_BOL));
    const r = await client.containers.fromBol('SELM60819800', 'HMM');
    expect(r.bill_of_lading).toBe('SELM60819800');
    expect(r.associated_containers).toBe(3);
    expect(r.associated_container_numbers).toHaveLength(3);
  });

  // 6
  test('fromBol rejects empty shipping_line', async () => {
    await expect(
      client.containers.fromBol('SELM60819800', '' as never)
    ).rejects.toThrow(/shipping_line is required/);
  });

  // 7
  test('fromBol rejects path traversal', async () => {
    await expect(
      client.containers.fromBol('../admin', 'MSC')
    ).rejects.toThrow(/Invalid bill of lading/);
  });

  // 8
  test('fromBol rejects URL-encoded slash', async () => {
    await expect(
      client.containers.fromBol('SELM%2F60819800', 'MSC')
    ).rejects.toThrow(/Invalid bill of lading/);
  });

  // 9
  test('fromBol rejects fragment char', async () => {
    await expect(
      client.containers.fromBol('SELM#60819800', 'MSC')
    ).rejects.toThrow(/Invalid bill of lading/);
  });

  // 29
  test('fromBol rejects query chars', async () => {
    await expect(
      client.containers.fromBol('SELM?foo=bar', 'MSC')
    ).rejects.toThrow(/Invalid bill of lading/);
  });
});

describe('Error mapping', () => {
  let client: Client;
  beforeEach(() => {
    client = new Client('test_key');
  });

  // 10
  test('401 -> AuthenticationError with statusCode 401 and "Invalid API key" message', async () => {
    stubFetch(async () => mockResponse({}, 401));
    await expect(client.containers.track('MSCU1234567', 'MSC')).rejects.toMatchObject({
      name: 'AuthenticationError',
      statusCode: 401,
      message: expect.stringContaining('Invalid API key'),
    });
  });

  // 11
  test('403 -> AuthenticationError with statusCode 403 and "Forbidden" message', async () => {
    stubFetch(async () => mockResponse({}, 403));
    await expect(client.containers.track('MSCU1234567', 'MSC')).rejects.toMatchObject({
      name: 'AuthenticationError',
      statusCode: 403,
      message: expect.stringContaining('Forbidden'),
    });
  });

  test('401 and 403 produce distinct messages', async () => {
    stubFetch(async () => mockResponse({}, 401));
    const err401 = await client.containers
      .track('MSCU1234567', 'MSC')
      .catch((e) => e);

    stubFetch(async () => mockResponse({}, 403));
    const err403 = await client.containers
      .track('MSCU1234567', 'MSC')
      .catch((e) => e);

    expect(err401.message).not.toBe(err403.message);
    expect(err401.statusCode).toBe(401);
    expect(err403.statusCode).toBe(403);
  });

  // 12
  test('404 -> NotFoundError with statusCode 404', async () => {
    stubFetch(async () => mockResponse({}, 404));
    await expect(client.containers.track('MSCU1234567', 'MSC')).rejects.toMatchObject({
      name: 'NotFoundError',
      statusCode: 404,
    });
  });

  // 13
  test('429 -> RateLimitError with statusCode 429', async () => {
    stubFetch(async () => mockResponse({}, 429));
    await expect(client.containers.track('MSCU1234567', 'MSC')).rejects.toMatchObject({
      name: 'RateLimitError',
      statusCode: 429,
    });
  });

  // 14
  test('500 -> APIError with statusCode 500', async () => {
    stubFetch(async () => mockResponse({}, 500));
    await expect(
      client.containers.track('MSCU1234567', 'MSC')
    ).rejects.toMatchObject({ statusCode: 500 });
  });

  // 15 — real network timeout using a live server that stalls
  test('timeout -> APIError (real AbortController wiring)', async () => {
    const server = http.createServer((_req, res) => {
      // Stall for 2 seconds — much longer than the 10ms timeout.
      setTimeout(() => res.end(), 2000);
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address() as { port: number };
    const shortClient = new Client('k', {
      baseUrl: `http://127.0.0.1:${addr.port}`,
      timeout: 10,
    });
    await expect(shortClient.stats()).rejects.toThrow(APIError);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  // 16
  test('non-JSON 200 -> APIError', async () => {
    stubFetch(async () => nonJsonResponse(200));
    await expect(client.containers.track('MSCU1234567', 'MSC')).rejects.toThrow(
      /non-JSON/
    );
  });

  // 17
  test('missing data key -> APIError', async () => {
    stubFetch(async () => mockResponse({ notdata: {} }, 200));
    await expect(client.containers.track('MSCU1234567', 'MSC')).rejects.toThrow(
      /missing 'data'/
    );
  });

  // 24 — nested error.title extraction
  test('nested error.title message extracted as APIError', async () => {
    stubFetch(async () =>
      mockResponse({ error: { title: 'container number is invalid' } }, 422)
    );
    await expect(
      client.containers.track('MSCU1234567', 'MSC')
    ).rejects.toMatchObject({
      message: 'container number is invalid',
    });
    await expect(
      client.containers.track('MSCU1234567', 'MSC')
    ).rejects.toBeInstanceOf(APIError);
  });

  // 25 — flat error string extraction
  test('flat error message extracted as APIError', async () => {
    stubFetch(async () =>
      mockResponse({ error: 'upstream service unavailable' }, 500)
    );
    await expect(
      client.containers.track('MSCU1234567', 'MSC')
    ).rejects.toMatchObject({
      message: 'upstream service unavailable',
    });
  });

  // D7a — nested error.message extraction
  test('nested error.message extracted', async () => {
    stubFetch(async () =>
      mockResponse({ error: { message: 'nested message error' } }, 503)
    );
    await expect(
      client.containers.track('MSCU1234567', 'MSC')
    ).rejects.toMatchObject({ message: 'nested message error' });
  });

  // D7b — top-level message field extraction
  test('top-level message field extracted', async () => {
    stubFetch(async () =>
      mockResponse({ message: 'top level message' }, 503)
    );
    await expect(
      client.containers.track('MSCU1234567', 'MSC')
    ).rejects.toMatchObject({ message: 'top level message' });
  });
});

describe('Stats and other resources', () => {
  let client: Client;
  beforeEach(() => {
    client = new Client('test_key');
  });

  // 18
  test('stats returns plan and counters', async () => {
    stubFetch(async () =>
      mockResponse({
        data: {
          plan: 'MARINER',
          requests_total: 2000,
          requests_made: 6,
          requests_available: 1994,
        },
      })
    );
    const s = await client.stats();
    expect(s.plan).toBe('MARINER');
    expect(s.requests_total).toBe(2000);
    expect(s.requests_made).toBe(6);
    expect(s.requests_available).toBe(1994);
  });

  // 19
  test('vessels.basic returns VesselBasic', async () => {
    stubFetch(async () =>
      mockResponse({ data: { uuid: 'u1', name: 'EVER GIVEN', mmsi: '353136000' } })
    );
    const v = await client.vessels.basic({ mmsi: '353136000' });
    expect(v.name).toBe('EVER GIVEN');
    expect(v.uuid).toBe('u1');
  });

  // 30
  test('vessels.basic rejects call with no identifier', async () => {
    await expect(client.vessels.basic({})).rejects.toThrow(
      /uuid, mmsi, or imo/
    );
  });

  test('vessels.pro returns VesselPro', async () => {
    stubFetch(async () =>
      mockResponse({ data: { uuid: 'u1', dest_port: 'ROTTERDAM' } })
    );
    const v = await client.vessels.pro({ uuid: 'u1' });
    expect(v.dest_port).toBe('ROTTERDAM');
  });

  // 20
  test('vessels.bulk returns total and vessels array', async () => {
    stubFetch(async () =>
      mockResponse({ data: { total: 2, vessels: [{ uuid: 'a' }, { uuid: 'b' }] } })
    );
    const r = await client.vessels.bulk({ imo: '9811000' });
    expect(r.total).toBe(2);
    expect(r.vessels).toHaveLength(2);
  });

  // 21
  test('vessels.finder returns array of VesselStatic', async () => {
    stubFetch(async () =>
      mockResponse({ data: [{ uuid: 'a', name: 'TEST' }] })
    );
    const r = await client.vessels.finder({ name: 'TEST' });
    expect(Array.isArray(r)).toBe(true);
    expect(r[0].name).toBe('TEST');
  });

  test('vessels.finder rejects empty params', async () => {
    await expect(client.vessels.finder({})).rejects.toThrow(
      /search parameter/
    );
  });

  test('vessels.specs returns VesselStatic', async () => {
    stubFetch(async () =>
      mockResponse({ data: { uuid: 'u1', gross_tonnage: 200000 } })
    );
    const v = await client.vessels.specs({ uuid: 'u1' });
    expect(v.gross_tonnage).toBe(200000);
  });

  // 22
  test('ports.find returns array of Port', async () => {
    stubFetch(async () =>
      mockResponse({ data: [{ uuid: 'p1', port_name: 'ROTTERDAM' }] })
    );
    const r = await client.ports.find({ name: 'ROTTERDAM' });
    expect(r[0].port_name).toBe('ROTTERDAM');
  });

  test('ports.find rejects empty params', async () => {
    await expect(client.ports.find({})).rejects.toThrow(/search parameter/);
  });

  // 23
  test('terminals.find returns array of Terminal', async () => {
    stubFetch(async () =>
      mockResponse({ data: [{ unlocode: 'NLRTM', terminal_name: 'ECT DELTA' }] })
    );
    const r = await client.terminals.find({ unlocode: 'NLRTM' });
    expect(r[0].terminal_name).toBe('ECT DELTA');
  });

  test('terminals.find rejects too-short unlocode', async () => {
    await expect(client.terminals.find({ unlocode: 'N' })).rejects.toThrow(
      /unlocode/
    );
  });
});

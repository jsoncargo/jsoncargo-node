import {
  APIError,
  AuthenticationError,
  JSONCargoError,
  NotFoundError,
  RateLimitError,
} from './errors';
import { ApiKeyStats } from './models';
import { ContainersResource } from './containers';
import { VesselsResource } from './vessels';
import { PortsResource } from './ports';
import { TerminalsResource } from './terminals';

/** Default API base URL. */
export const DEFAULT_BASE_URL = 'http://api.jsoncargo.com/api/v1';

/** Default per-request timeout in milliseconds. */
export const DEFAULT_TIMEOUT = 30000;

/** Query parameter values; `undefined` entries are stripped before the request. */
export type QueryParams = Record<string, string | number | undefined>;

/** Options accepted by the {@link Client} constructor. */
export interface ClientOptions {
  baseUrl?: string;
  timeout?: number;
}

/**
 * Extracts a human-readable error message from a parsed error body, trying the
 * known locations in priority order before falling back to the HTTP status text.
 */
function extractErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    const error = obj.error;
    if (error && typeof error === 'object') {
      const e = error as Record<string, unknown>;
      if (typeof e.title === 'string' && e.title) {
        return e.title;
      }
      if (typeof e.message === 'string' && e.message) {
        return e.message;
      }
    }
    if (typeof error === 'string' && error) {
      return error;
    }
    if (typeof obj.message === 'string' && obj.message) {
      return obj.message;
    }
  }
  return fallback;
}

/**
 * HTTP client for the container and vessel tracking API.
 *
 * Construct once with an API key and reuse it; resource groups are exposed as
 * readonly properties:
 *
 * ```ts
 * const client = new Client('your_api_key');
 * const container = await client.containers.track('MSCU1234567', 'MSC');
 * ```
 */
export class Client {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  readonly containers: ContainersResource;
  readonly vessels: VesselsResource;
  readonly ports: PortsResource;
  readonly terminals: TerminalsResource;

  constructor(apiKey: string, options: ClientOptions = {}) {
    if (!apiKey) {
      throw new JSONCargoError('api_key is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;

    this.containers = new ContainersResource(this);
    this.vessels = new VesselsResource(this);
    this.ports = new PortsResource(this);
    this.terminals = new TerminalsResource(this);
  }

  /**
   * Performs a GET request, maps transport and HTTP failures to typed errors,
   * and returns the unwrapped `data` payload from a successful response.
   */
  async _get(path: string, params?: QueryParams): Promise<unknown> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'x-api-key': this.apiKey },
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new APIError('Request timed out');
      }
      const detail = err instanceof Error ? err.message : String(err);
      throw new APIError(`Connection failed: ${detail}`);
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 401) {
      response.body?.cancel().catch(() => undefined);
      throw new AuthenticationError('Invalid API key', 401);
    }
    if (response.status === 403) {
      response.body?.cancel().catch(() => undefined);
      throw new AuthenticationError(
        'Forbidden: API key does not have permission for this resource',
        403
      );
    }
    if (response.status === 404) {
      response.body?.cancel().catch(() => undefined);
      throw new NotFoundError('Resource not found', 404);
    }
    if (response.status === 429) {
      response.body?.cancel().catch(() => undefined);
      throw new RateLimitError('API rate limit exceeded', 429);
    }
    if (!response.ok) {
      const fallback = response.statusText || `HTTP ${response.status}`;
      let message = fallback;
      try {
        const body = await response.json();
        message = extractErrorMessage(body, fallback);
      } catch {
        // Body was not JSON; keep the status-text fallback.
      }
      throw new APIError(message, response.status);
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new APIError('Server returned a non-JSON response');
    }

    if (
      !body ||
      typeof body !== 'object' ||
      !('data' in body) ||
      (body as { data: unknown }).data === null
    ) {
      throw new APIError("Unexpected response format: missing 'data' key");
    }

    return (body as { data: unknown }).data;
  }

  /** Returns API key plan and usage counters. */
  async stats(): Promise<ApiKeyStats> {
    return (await this._get('/api_key/stats')) as ApiKeyStats;
  }
}

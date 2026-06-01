import { JSONCargoError } from './errors';
import { Port } from './models';
import type { Client, QueryParams } from './client';

/** Search parameters for the port finder. */
export interface PortFindParams {
  lat?: number;
  lon?: number;
  radius?: number;
  name?: string;
  country_iso?: string;
  port_type?: string;
  fuzzy?: number;
  page?: number;
  limit?: number;
}

/** Port lookup methods. Access via `client.ports`. */
export class PortsResource {
  constructor(private readonly client: Client) {}

  /** Finds ports by location radius or name and attribute filters. */
  async find(params: PortFindParams): Promise<Port[]> {
    // page and limit are pagination-only and do not count as search parameters.
    const { page, limit, ...searchParams } = params;
    const hasParam = Object.values(searchParams).some(
      (v) => v !== undefined && v !== ''
    );
    if (!hasParam) {
      throw new JSONCargoError('At least one search parameter is required');
    }
    return (await this.client._get(
      '/port/find',
      params as QueryParams
    )) as Port[];
  }
}

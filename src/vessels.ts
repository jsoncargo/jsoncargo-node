import { JSONCargoError } from './errors';
import {
  VesselBasic,
  VesselBulkResult,
  VesselPro,
  VesselStatic,
} from './models';
import type { Client, QueryParams } from './client';

/** Identity parameters for single-vessel lookups (basic, pro, bulk, specs). */
export interface VesselLookupParams {
  uuid?: string;
  mmsi?: string;
  imo?: string;
  page?: number;
  limit?: number;
}

/** Search parameters for the vessel finder. */
export interface VesselFinderParams {
  name?: string;
  fuzzy?: number;
  type?: string;
  type_specific?: string;
  country_iso?: string;
  gross_tonnage_min?: number;
  gross_tonnage_max?: number;
  deadweight_min?: number;
  deadweight_max?: number;
  length_min?: number;
  length_max?: number;
  breadth_min?: number;
  breadth_max?: number;
  year_built_min?: number;
  year_built_max?: number;
  next?: string;
  page?: number;
  limit?: number;
}

function requireIdentifier(params: VesselLookupParams): void {
  if (!params.uuid && !params.mmsi && !params.imo) {
    throw new JSONCargoError(
      'At least one of uuid, mmsi, or imo is required'
    );
  }
}

function requireSearchParam(params: VesselFinderParams): void {
  // page, limit, next are pagination-only — they are not search parameters.
  const { page, limit, next, ...searchParams } = params;
  const hasParam = Object.values(searchParams).some(
    (v) => v !== undefined && v !== ''
  );
  if (!hasParam) {
    throw new JSONCargoError('At least one search parameter is required');
  }
}

/** Vessel lookup and search methods. Access via `client.vessels`. */
export class VesselsResource {
  constructor(private readonly client: Client) {}

  /** Returns a single vessel's basic position and identity. */
  async basic(params: VesselLookupParams): Promise<VesselBasic> {
    requireIdentifier(params);
    return (await this.client._get(
      '/vessel/basic',
      params as QueryParams
    )) as VesselBasic;
  }

  /** Returns a single vessel's extended position with voyage detail. */
  async pro(params: VesselLookupParams): Promise<VesselPro> {
    requireIdentifier(params);
    return (await this.client._get(
      '/vessel/pro',
      params as QueryParams
    )) as VesselPro;
  }

  /** Returns a page of vessels matching the supplied identifiers. */
  async bulk(params: VesselLookupParams): Promise<VesselBulkResult> {
    requireIdentifier(params);
    return (await this.client._get(
      '/vessel/bulk',
      params as QueryParams
    )) as VesselBulkResult;
  }

  /** Searches static vessel particulars by name and attribute filters. */
  async finder(params: VesselFinderParams): Promise<VesselStatic[]> {
    requireSearchParam(params);
    return (await this.client._get(
      '/vessel/finder',
      params as QueryParams
    )) as VesselStatic[];
  }

  /** Returns a single vessel's static particulars. */
  async specs(params: VesselLookupParams): Promise<VesselStatic> {
    requireIdentifier(params);
    return (await this.client._get(
      '/vessel/specs',
      params as QueryParams
    )) as VesselStatic;
  }
}

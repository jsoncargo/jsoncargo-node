/**
 * Response shapes returned by the API.
 *
 * These are plain interfaces describing the JSON the server returns. The client
 * unwraps the `{ data: ... }` envelope and returns the inner object typed as one
 * of these. Fields are optional because the upstream service may omit any of
 * them depending on the data it holds for a given resource.
 */

/** Shipping line identifiers accepted for container and BOL lookups. */
export type ShippingLine =
  | 'MAERSK'
  | 'HAPAG_LLOYD'
  | 'HMM'
  | 'ONE'
  | 'EVERGREEN'
  | 'MSC'
  | 'CMA_CGM'
  | 'COSCO'
  | 'ZIM'
  | 'YANG_MING'
  | 'PIL';

/** A tracked container. */
export interface Container {
  container_id?: string;
  container_type?: string;
  container_status?: string;
  shipping_line_name?: string;
  shipping_line_id?: string;
  tare?: number;
  shipped_from?: string;
  shipped_from_terminal?: string;
  shipped_to?: string;
  shipped_to_terminal?: string;
  atd_origin?: string;
  eta_final_destination?: string;
  last_location?: string;
  last_location_terminal?: string;
  next_location?: string;
  next_location_terminal?: string;
  atd_last_location?: string;
  eta_next_destination?: string;
  timestamp_of_last_location?: string;
  last_movement_timestamp?: string;
  loading_port?: string;
  discharging_port?: string;
  customs_clearance?: string | null;
  bill_of_lading?: string;
  last_vessel_name?: string;
  last_voyage_number?: string;
  current_vessel_name?: string;
  current_voyage_number?: string;
  last_updated?: string;
}

/** Result of a bill of lading lookup. */
export interface BolResult {
  bill_of_lading?: string;
  shipping_line_name?: string;
  shipping_line_id?: string;
  associated_containers?: number;
  associated_container_numbers?: string[];
  last_updated?: string;
}

/** Basic vessel position and identity. */
export interface VesselBasic {
  uuid?: string;
  name?: string;
  mmsi?: string;
  imo?: string;
  eni?: string;
  country_iso?: string;
  type?: string;
  type_specific?: string;
  lat?: number;
  lon?: number;
  speed?: number;
  course?: number;
  heading?: number;
  navigation_status?: string;
  destination?: string;
  last_position_epoch?: number;
  last_position_UTC?: string;
  eta_epoch?: number;
  eta_UTC?: string;
}

/** Extended vessel position with voyage and port detail. */
export interface VesselPro extends VesselBasic {
  current_draught?: number;
  dest_port_uuid?: string;
  dest_port?: string;
  dest_port_unlocode?: string;
  dep_port_uuid?: string;
  dep_port?: string;
  dep_port_unlocode?: string;
  atd_epoch?: number;
  atd_UTC?: string;
  timezone_offset_sec?: number;
  timezone?: string;
}

/** A page of vessels returned by the bulk endpoint. */
export interface VesselBulkResult {
  total?: number;
  vessels?: VesselBasic[];
}

/** Static vessel particulars returned by finder and specs. */
export interface VesselStatic {
  uuid?: string;
  name?: string;
  name_ais?: string;
  mmsi?: string;
  imo?: string;
  eni?: string;
  country_iso?: string;
  country_name?: string;
  callsign?: string;
  type?: string;
  type_specific?: string;
  gross_tonnage?: number;
  deadweight?: number;
  teu?: number;
  liquid_gas?: number;
  length?: number;
  breadth?: number;
  draught_avg?: number;
  draught_max?: number;
  speed_avg?: number;
  speed_max?: number;
  year_built?: number;
  is_navaid?: boolean;
  home_port?: string;
}

/** A port record. */
export interface Port {
  uuid?: string;
  port_name?: string;
  country_iso?: string;
  country_name?: string;
  unlocode?: string;
  port_type?: string;
  lat?: number;
  lon?: number;
  area_lvl1?: string;
  area_lvl2?: string;
  port_code?: string;
  country?: string;
  size?: string;
  area?: string;
  city?: string;
}

/** A terminal record. */
export interface Terminal {
  unlocode?: string;
  alt_unlocode?: string;
  code?: string;
  terminal_name?: string;
  company_name?: string;
  lat?: number;
  lon?: number;
  url?: string;
  address?: string;
}

/** API key plan and usage counters. */
export interface ApiKeyStats {
  plan?: string;
  requests_total?: number;
  requests_made?: number;
  requests_available?: number;
}

export {
  Client,
  DEFAULT_BASE_URL,
  DEFAULT_TIMEOUT,
} from './client';
export type { ClientOptions, QueryParams } from './client';

export {
  JSONCargoError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  APIError,
} from './errors';

export { ContainersResource, VALID_SHIPPING_LINES } from './containers';
export { VesselsResource } from './vessels';
export type { VesselLookupParams, VesselFinderParams } from './vessels';
export { PortsResource } from './ports';
export type { PortFindParams } from './ports';
export { TerminalsResource } from './terminals';
export type { TerminalFindParams } from './terminals';

export type {
  ShippingLine,
  Container,
  BolResult,
  VesselBasic,
  VesselPro,
  VesselBulkResult,
  VesselStatic,
  Port,
  Terminal,
  ApiKeyStats,
} from './models';

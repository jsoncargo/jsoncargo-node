import { JSONCargoError } from './errors';
import { BolResult, Container, ShippingLine } from './models';
import type { Client } from './client';

/** Shipping lines accepted by container and BOL lookups. */
export const VALID_SHIPPING_LINES: ReadonlySet<string> = new Set<ShippingLine>([
  'MAERSK',
  'HAPAG_LLOYD',
  'HMM',
  'ONE',
  'EVERGREEN',
  'MSC',
  'CMA_CGM',
  'COSCO',
  'ZIM',
  'YANG_MING',
  'PIL',
]);

const CONTAINER_RE = /^[A-Z]{4}\d{7}$/;
// Reject path traversal, URL-encoded separators, query/fragment chars, and nulls.
const BOL_UNSAFE_RE = /[/\\%#?&+\x00]|\.\./;

function validateShippingLine(shippingLine: string, context: string): void {
  if (!shippingLine) {
    throw new JSONCargoError(`shipping_line is required${context}`);
  }
  if (!VALID_SHIPPING_LINES.has(shippingLine)) {
    const allowed = Array.from(VALID_SHIPPING_LINES).sort().join(', ');
    throw new JSONCargoError(
      `Invalid shipping_line '${shippingLine}'. Must be one of: ${allowed}`
    );
  }
}

function validateTrackingNumber(trackingNumber: string): void {
  if (!CONTAINER_RE.test(trackingNumber)) {
    throw new JSONCargoError(
      `Invalid container number '${trackingNumber}'. ` +
        'Expected 4 uppercase letters followed by 7 digits (e.g. MSCU1234567).'
    );
  }
}

function validateBol(billOfLading: string): void {
  if (!billOfLading) {
    throw new JSONCargoError('bill_of_lading is required');
  }
  if (BOL_UNSAFE_RE.test(billOfLading)) {
    throw new JSONCargoError(`Invalid bill of lading number '${billOfLading}'.`);
  }
}

/** Container tracking methods. Access via `client.containers`. */
export class ContainersResource {
  constructor(private readonly client: Client) {}

  /**
   * Tracks a container by its number.
   *
   * @param trackingNumber ISO 6346 number: 4 uppercase letters + 7 digits.
   * @param shippingLine Required carrier identifier.
   */
  async track(
    trackingNumber: string,
    shippingLine: ShippingLine
  ): Promise<Container> {
    validateShippingLine(shippingLine, '');
    validateTrackingNumber(trackingNumber);

    return (await this.client._get(`/containers/${trackingNumber}`, {
      shipping_line: shippingLine,
    })) as Container;
  }

  /**
   * Looks up the containers associated with a bill of lading.
   *
   * @param billOfLading BOL number; rejected if it contains unsafe characters.
   * @param shippingLine Required carrier identifier.
   */
  async fromBol(
    billOfLading: string,
    shippingLine: ShippingLine
  ): Promise<BolResult> {
    validateShippingLine(shippingLine, ' for BOL lookups');
    validateBol(billOfLading);

    return (await this.client._get(`/containers/bol/${billOfLading}`, {
      shipping_line: shippingLine,
    })) as BolResult;
  }
}

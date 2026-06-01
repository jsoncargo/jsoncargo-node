/**
 * Error hierarchy for the SDK.
 *
 * All errors thrown by this library extend {@link JSONCargoError}, so callers
 * can catch the base class to handle any SDK failure, or catch a specific
 * subclass to react to a particular HTTP condition.
 */

/** Base class for every error raised by this SDK. */
export class JSONCargoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JSONCargoError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Raised when the API key is invalid or missing (HTTP 401) or lacks permission (HTTP 403). */
export class AuthenticationError extends JSONCargoError {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = statusCode;
  }
}

/** Raised when the requested resource does not exist (HTTP 404). */
export class NotFoundError extends JSONCargoError {
  readonly statusCode: number;

  constructor(message: string, statusCode = 404) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = statusCode;
  }
}

/** Raised when the request rate limit is exceeded (HTTP 429). */
export class RateLimitError extends JSONCargoError {
  readonly statusCode: number;

  constructor(message: string, statusCode = 429) {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = statusCode;
  }
}

/**
 * Raised for all other HTTP errors, transport failures (timeout, connection
 * refused), non-JSON response bodies, and responses missing the `data` key.
 *
 * `statusCode` is populated for HTTP errors and left undefined for transport
 * or parsing failures that never produced a status line.
 */
export class APIError extends JSONCargoError {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
  }
}

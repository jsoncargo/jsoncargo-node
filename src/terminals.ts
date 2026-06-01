import { JSONCargoError } from './errors';
import { Terminal } from './models';
import type { Client, QueryParams } from './client';

/** Search parameters for the terminal finder. */
export interface TerminalFindParams {
  unlocode: string;
  page?: number;
  limit?: number;
}

/** Terminal lookup methods. Access via `client.terminals`. */
export class TerminalsResource {
  constructor(private readonly client: Client) {}

  /** Finds terminals by UN/LOCODE. */
  async find(params: TerminalFindParams): Promise<Terminal[]> {
    if (!params.unlocode || params.unlocode.length < 2) {
      throw new JSONCargoError('unlocode is required and must be at least 2 characters');
    }
    return (await this.client._get(
      '/terminal',
      params as unknown as QueryParams
    )) as Terminal[];
  }
}

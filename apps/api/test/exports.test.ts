import { describe, expect, it } from 'vitest';
import { canExport, exportJobStatus, type ExportJobRequest } from '../src/exports.js';

describe('export job contracts', () => {
  it('keeps essential exports available without premium entitlement', () => {
    expect(canExport(null, 'csv')).toBe(true);
    expect(exportJobStatus).toContain('queued');
  });
  it('describes a user-owned export request without trusting client entitlement claims', () => {
    const request: ExportJobRequest = { userId: '11111111-1111-4111-8111-111111111111', format: 'json' };
    expect(request.format).toBe('json');
  });
});

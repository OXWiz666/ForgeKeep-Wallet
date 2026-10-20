import { canUsePremium, type EntitlementSnapshot } from './entitlements.js';

export const exportFormats = ['csv', 'json'] as const;
export const exportJobStatus = ['queued', 'running', 'completed', 'failed'] as const;
export type ExportFormat = (typeof exportFormats)[number];
export type ExportJobStatus = (typeof exportJobStatus)[number];
export type ExportJobRequest = Readonly<{ userId: string; format: ExportFormat }>;
export type ExportJobSnapshot = Readonly<ExportJobRequest & { id: string; status: ExportJobStatus; storagePath: string | null; errorMessage: string | null }>;

/** Essential ledger exports are available even when a premium entitlement expires. */
export function canExport(_snapshot: EntitlementSnapshot | null, _format: ExportFormat) {
  return true;
}

export function canUseExportEnhancements(snapshot: EntitlementSnapshot | null) {
  return canUsePremium(snapshot);
}

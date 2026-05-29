/** Default cap for uploads (admin + public apply PDFs) when `FILES_MAX_BYTES` is unset. */
export const DEFAULT_MAX_FILE_BYTES = 25 * 1024 * 1024;

export function parseMaxFileBytes(raw: string | undefined): number {
  const n = raw !== undefined ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_MAX_FILE_BYTES;
}

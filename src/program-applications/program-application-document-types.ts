/** Allowed `documentType` values on application attachments. */
export const PROGRAM_APPLICATION_DOCUMENT_TYPES = [
  'transcript',
  'government_id',
  'credentials',
  'police_check',
  'immunization',
  'cpr_certification',
  'other',
] as const;

export type ProgramApplicationDocumentType =
  (typeof PROGRAM_APPLICATION_DOCUMENT_TYPES)[number];

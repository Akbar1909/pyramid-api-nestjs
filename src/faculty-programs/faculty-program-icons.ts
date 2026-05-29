/** Allowed `iconKey` values for `FacultyProgram` (mapped to UI icons on the website). */
export const FACULTY_PROGRAM_ICON_KEYS = [
  'cardiac',
  'cardiology',
  'psw',
  'medical_admin',
  'science',
  'generic',
] as const;

export type FacultyProgramIconKey = (typeof FACULTY_PROGRAM_ICON_KEYS)[number];

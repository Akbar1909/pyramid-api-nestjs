import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const GENERAL_REQUIREMENTS = [
  'Ontario Secondary School Diploma (OSSD) or equivalent',
  'Proof of English proficiency (Grade 11/12 English Credit accepted)',
  'Completion of prerequisite courses (e.g., Grade 12 English, Biology, Chemistry, or Math)',
  'Valid government-issued photo identification (Driver’s License, Ontario Photo Card, Passport, or Permanent Resident Card)',
];

const ADMISSIONS_INTRO_HTML = `<p>We welcome applicants who are motivated to pursue a career in healthcare. Our admission requirements are designed to ensure students are prepared for both the academic and practical components of their chosen program.</p>
<ol>
<li><strong>Choose Your Program</strong> — Review program details and ensure you meet the admission requirements.</li>
<li><strong>Submit Your Application</strong> — Complete the online application form with your personal information, program and preferred start date, supplementary questions, and required documents.</li>
<li><strong>Admissions Review</strong> — Qualified applicants may be invited for an interview or entrance assessment.</li>
<li><strong>Receive Offer &amp; Enroll</strong> — If accepted, confirm your enrollment and complete any final requirements (e.g., immunizations, police check, CPR).</li>
</ol>`;

const PROGRAMS = [
  {
    slug: 'clinical-assistant',
    title: 'Clinical Assistant Certificate',
    description:
      'Gain practical experience in Canadian healthcare settings for individuals with prior medical education.',
    iconKey: 'clinical_assistant',
    sortOrder: 0,
    duration: '6 weeks (2 sessions per week, 3 hours per session)',
    credentialType: 'Certificate',
    format: 'Part-time',
    admissionRequirements: [
      'Currently enrolled in medical school, OR completion of a medical degree (in Canada or internationally)',
      'Proof of credentials (for internationally trained applicants)',
      'Proof of English proficiency',
    ],
    clinicalRequirements: [
      'Police Vulnerable Sector Check',
      'Up-to-date immunizations',
      'CPR/BLS certification',
    ],
    body: '<p>The Clinical Assistant program is designed for individuals with prior medical education who wish to gain practical experience in Canadian healthcare settings. Students support physicians and healthcare teams in clinical environments.</p>',
  },
  {
    slug: 'cardiac-sonography',
    title: 'Cardiac Sonography Diploma',
    description:
      'Perform diagnostic imaging of the heart to assist physicians in identifying and monitoring cardiovascular conditions.',
    iconKey: 'cardiac',
    sortOrder: 1,
    duration: '18 months',
    credentialType: 'Diploma',
    admissionRequirements: [
      'OSSD or equivalent',
      'Grade 12 English (minimum 60%)',
      'Grade 12 Math',
      'Biology and/or Physics',
    ],
    clinicalRequirements: [
      'Police Vulnerable Sector Check',
      'Up-to-date immunizations',
      'CPR/First Aid certification',
    ],
    body: '<p>Cardiac Sonographers perform diagnostic imaging of the heart to assist physicians in identifying and monitoring cardiovascular conditions.</p>',
  },
  {
    slug: 'cardiology-technology',
    title: 'Cardiology Technology (Cardio-Technologist) Diploma',
    description:
      'Develop skills for non-invasive cardiac procedures including ECG, Holter monitoring, and exercise stress testing.',
    iconKey: 'cardiology',
    sortOrder: 2,
    duration: 'Approximately 76 weeks (including practicum)',
    credentialType: 'Diploma',
    format: 'Full-time, in-person',
    practicumHours: 600,
    admissionRequirements: [
      'OSSD or equivalent',
      'Grade 11 or 12 English',
      'Grade 11 or 12 Math',
      'One Science (Biology preferred)',
    ],
    clinicalRequirements: [
      'Police Vulnerable Sector Check',
      'Up-to-date immunizations (including Hepatitis B)',
      'CPR/BLS certification',
      'Mask fit testing',
      'Physically capable of assisting patients and handling medical equipment',
    ],
    body: '<p>Students develop the skills required to perform non-invasive cardiac procedures, including electrocardiograms (ECG), Holter monitoring, and exercise stress testing. Training includes hands-on experience using industry-standard equipment in real clinical environments.</p>',
  },
  {
    slug: 'medical-office-administration',
    title: 'Medical Office Administration Diploma',
    description:
      'Prepare to manage daily operations of healthcare facilities including scheduling, patient records, and billing.',
    iconKey: 'medical_admin',
    sortOrder: 3,
    duration: '9 months',
    credentialType: 'Diploma',
    admissionRequirements: [
      'OSSD or equivalent',
      'Grade 12 English',
      'Basic computer skills and the ability to learn medical software systems such as ABELMed',
    ],
    clinicalRequirements: [],
    body: '<p>The Medical Office Administration program prepares students to manage the daily operations of healthcare facilities, including scheduling, patient records, and billing systems.</p>',
  },
  {
    slug: 'personal-support-worker',
    title: 'Personal Support Worker (PSW) Diploma',
    description:
      'Provide essential care and assistance to individuals in hospitals, long-term care facilities, and home settings.',
    iconKey: 'psw',
    sortOrder: 4,
    duration: '15 months',
    credentialType: 'Diploma',
    admissionRequirements: ['OSSD or equivalent'],
    clinicalRequirements: [
      'Police Vulnerable Sector Check',
      'Up-to-date immunizations',
      'CPR/First Aid certification',
    ],
    body: '<p>Personal Support Workers provide essential care and assistance to individuals in hospitals, long-term care facilities, and home settings.</p>',
  },
] as const;

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const hash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { passwordHash: hash, role: Role.ADMIN },
    create: {
      email: 'admin@example.com',
      passwordHash: hash,
      role: Role.ADMIN,
    },
  });

  await prisma.profile.upsert({
    where: { userId: admin.id },
    create: { userId: admin.id },
    update: {},
  });

  const content = await prisma.user.upsert({
    where: { email: 'content@example.com' },
    update: { passwordHash: hash, role: Role.CONTENT_MANAGER },
    create: {
      email: 'content@example.com',
      passwordHash: hash,
      role: Role.CONTENT_MANAGER,
    },
  });

  await prisma.profile.upsert({
    where: { userId: content.id },
    create: { userId: content.id },
    update: {},
  });

  await prisma.admissionsContent.upsert({
    where: { id: 'site' },
    create: {
      id: 'site',
      introHtml: ADMISSIONS_INTRO_HTML,
      generalRequirements: GENERAL_REQUIREMENTS,
    },
    update: {
      introHtml: ADMISSIONS_INTRO_HTML,
      generalRequirements: GENERAL_REQUIREMENTS,
    },
  });

  for (const program of PROGRAMS) {
    await prisma.facultyProgram.upsert({
      where: { slug: program.slug },
      create: {
        ...program,
        clinicalRequirements:
          program.clinicalRequirements.length > 0
            ? program.clinicalRequirements
            : undefined,
        isPublished: true,
      },
      update: {
        title: program.title,
        description: program.description,
        iconKey: program.iconKey,
        sortOrder: program.sortOrder,
        duration: program.duration,
        credentialType: program.credentialType,
        format: 'format' in program ? program.format : null,
        practicumHours:
          'practicumHours' in program ? program.practicumHours : null,
        admissionRequirements: program.admissionRequirements,
        clinicalRequirements:
          program.clinicalRequirements.length > 0
            ? program.clinicalRequirements
            : [],
        body: program.body,
        isPublished: true,
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

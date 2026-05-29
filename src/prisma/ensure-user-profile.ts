import { Profile, Role } from '@prisma/client';
import { PrismaService } from './prisma.service';

/**
 * Ensures base `Profile` exists. For `APPLICANT` / `STUDENT`, ensures the role-specific
 * row exists (`ApplicantProfile` / `StudentProfile`). Staff only get the base profile.
 */
export async function ensureUserProfile(
  prisma: PrismaService,
  userId: string,
): Promise<Profile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    return null;
  }

  const profile = await prisma.profile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  if (user.role === Role.APPLICANT) {
    await prisma.applicantProfile.upsert({
      where: { profileId: profile.id },
      create: { profileId: profile.id },
      update: {},
    });
  }
  if (user.role === Role.STUDENT) {
    await prisma.studentProfile.upsert({
      where: { profileId: profile.id },
      create: { profileId: profile.id },
      update: {},
    });
  }

  return profile;
}

import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Ensures `thumbnailId` refers to an existing `StoredFile` with an image MIME type.
 * @returns trimmed id, or `undefined` if input is absent / blank.
 */
export async function requireImageStoredFileId(
  prisma: PrismaService,
  thumbnailId: string | undefined,
): Promise<string | undefined> {
  const raw = thumbnailId?.trim();
  if (!raw) {
    return undefined;
  }
  const row = await prisma.storedFile.findUnique({ where: { id: raw } });
  if (!row) {
    throw new BadRequestException('Invalid thumbnailId: file not found');
  }
  if (!row.mimeType.startsWith('image/')) {
    throw new BadRequestException('Thumbnail must be an image (not PDF, etc.)');
  }
  return raw;
}

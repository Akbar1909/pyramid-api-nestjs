import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { requireImageStoredFileId } from '../files/require-image-stored-file';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCareerQuizQuestionDto } from './dto/create-career-quiz-question.dto';
import { CreateCareerQuizDto } from './dto/create-career-quiz.dto';
import { UpdateCareerQuizQuestionDto } from './dto/update-career-quiz-question.dto';
import { UpdateCareerQuizDto } from './dto/update-career-quiz.dto';

const imageFileSelect = {
  id: true,
  url: true,
  mimeType: true,
  filename: true,
  originalName: true,
} as const;

const questionInclude = {
  imageFile: { select: imageFileSelect },
  options: { orderBy: { sortOrder: 'asc' as const } },
} as const;

const quizIncludeFull = {
  questions: {
    orderBy: { stepOrder: 'asc' as const },
    include: questionInclude,
  },
} as const;

@Injectable()
export class CareerQuizService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureUniqueStepOrder(
    quizId: string,
    stepOrder: number,
    excludeQuestionId?: string,
  ) {
    const existing = await this.prisma.careerQuizQuestion.findFirst({
      where: {
        quizId,
        stepOrder,
        ...(excludeQuestionId ? { id: { not: excludeQuestionId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException(
        `Step order ${stepOrder} is already used in this quiz`,
      );
    }
  }

  private async unpublishOtherQuizzes(exceptId: string) {
    await this.prisma.careerQuiz.updateMany({
      where: { id: { not: exceptId }, isPublished: true },
      data: { isPublished: false },
    });
  }

  async create(dto: CreateCareerQuizDto) {
    const row = await this.prisma.careerQuiz.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || undefined,
        displayTotalSteps: dto.displayTotalSteps ?? undefined,
        isPublished: dto.isPublished ?? false,
      },
    });
    if (row.isPublished) {
      await this.unpublishOtherQuizzes(row.id);
    }
    return this.findOneAdmin(row.id);
  }

  findAllAdmin() {
    return this.prisma.careerQuiz.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        questions: {
          orderBy: { stepOrder: 'asc' },
          include: { options: true },
        },
      },
    });
  }

  /** Public payload: never expose which option is marked correct. */
  private toPublishedQuiz(
    quiz: NonNullable<Awaited<ReturnType<typeof this.findOneAdmin>>>,
  ) {
    return {
      ...quiz,
      questions: quiz.questions.map((q) => ({
        ...q,
        options: q.options.map(({ isCorrect: _c, ...opt }) => opt),
      })),
    };
  }

  async findPublished() {
    const quiz = await this.prisma.careerQuiz.findFirst({
      where: { isPublished: true },
      orderBy: { updatedAt: 'desc' },
      include: quizIncludeFull,
    });
    if (!quiz) {
      throw new NotFoundException('No published career quiz');
    }
    return this.toPublishedQuiz(quiz);
  }

  async findOneAdmin(id: string) {
    const quiz = await this.prisma.careerQuiz.findUnique({
      where: { id },
      include: quizIncludeFull,
    });
    if (!quiz) {
      throw new NotFoundException();
    }
    return quiz;
  }

  async update(id: string, dto: UpdateCareerQuizDto) {
    await this.findOneAdmin(id);
    const data: Prisma.CareerQuizUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title.trim();
    }
    if (dto.description !== undefined) {
      data.description =
        dto.description === null ? null : dto.description.trim();
    }
    if (dto.displayTotalSteps !== undefined) {
      data.displayTotalSteps = dto.displayTotalSteps;
    }
    if (dto.isPublished !== undefined) {
      data.isPublished = dto.isPublished;
    }
    await this.prisma.careerQuiz.update({ where: { id }, data });
    const updated = await this.findOneAdmin(id);
    if (updated.isPublished) {
      await this.unpublishOtherQuizzes(id);
    }
    return this.findOneAdmin(id);
  }

  async remove(id: string) {
    await this.findOneAdmin(id);
    await this.prisma.careerQuiz.delete({ where: { id } });
  }

  async createQuestion(quizId: string, dto: CreateCareerQuizQuestionDto) {
    await this.findOneAdmin(quizId);
    await this.ensureUniqueStepOrder(quizId, dto.stepOrder);
    const imageId = await requireImageStoredFileId(this.prisma, dto.imageFileId);

    return this.prisma.$transaction(async (tx) => {
      const q = await tx.careerQuizQuestion.create({
        data: {
          stepOrder: dto.stepOrder,
          categoryLabel: dto.categoryLabel.trim(),
          questionText: dto.questionText.trim(),
          quoteText: dto.quoteText?.trim() || undefined,
          quoteIconKey: dto.quoteIconKey?.trim() || undefined,
          quiz: { connect: { id: quizId } },
          ...(imageId ? { imageFile: { connect: { id: imageId } } } : {}),
        },
      });
      const labels = ['A', 'B', 'C'] as const;
      await tx.careerQuizOption.createMany({
        data: dto.options.map((o, i) => ({
          questionId: q.id,
          label: labels[i] ?? String(i + 1),
          title: o.title.trim(),
          description: o.description.trim(),
          isCorrect: i === dto.correctOptionIndex,
          sortOrder: i,
        })),
      });
      return tx.careerQuizQuestion.findUniqueOrThrow({
        where: { id: q.id },
        include: questionInclude,
      });
    });
  }

  async updateQuestion(questionId: string, dto: UpdateCareerQuizQuestionDto) {
    const existing = await this.prisma.careerQuizQuestion.findUnique({
      where: { id: questionId },
      include: { quiz: true },
    });
    if (!existing) {
      throw new NotFoundException();
    }
    if (dto.stepOrder !== undefined && dto.stepOrder !== existing.stepOrder) {
      await this.ensureUniqueStepOrder(
        existing.quizId,
        dto.stepOrder,
        questionId,
      );
    }

    let imageId: string | undefined | null = undefined;
    if (dto.imageFileId !== undefined) {
      const raw = dto.imageFileId.trim();
      if (!raw) {
        imageId = null;
      } else {
        imageId = await requireImageStoredFileId(this.prisma, raw);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.careerQuizQuestion.update({
        where: { id: questionId },
        data: {
          ...(dto.stepOrder !== undefined ? { stepOrder: dto.stepOrder } : {}),
          ...(dto.categoryLabel !== undefined
            ? { categoryLabel: dto.categoryLabel.trim() }
            : {}),
          ...(dto.questionText !== undefined
            ? { questionText: dto.questionText.trim() }
            : {}),
          ...(dto.quoteText !== undefined
            ? { quoteText: dto.quoteText.trim() || null }
            : {}),
          ...(dto.quoteIconKey !== undefined
            ? { quoteIconKey: dto.quoteIconKey.trim() || null }
            : {}),
          ...(imageId !== undefined
            ? imageId
              ? { imageFile: { connect: { id: imageId } } }
              : { imageFile: { disconnect: true } }
            : {}),
        },
      });

      if (dto.options !== undefined) {
        if (dto.options.length !== 3) {
          throw new BadRequestException('Exactly three options (A, B, C) are required');
        }
        if (
          dto.correctOptionIndex === undefined ||
          dto.correctOptionIndex < 0 ||
          dto.correctOptionIndex > 2
        ) {
          throw new BadRequestException(
            'correctOptionIndex is required (0 = A, 1 = B, 2 = C) when updating options',
          );
        }
        const labels = ['A', 'B', 'C'] as const;
        await tx.careerQuizOption.deleteMany({ where: { questionId } });
        await tx.careerQuizOption.createMany({
          data: dto.options.map((o, i) => ({
            questionId,
            label: labels[i] ?? String(i + 1),
            title: o.title.trim(),
            description: o.description.trim(),
            isCorrect: i === dto.correctOptionIndex,
            sortOrder: i,
          })),
        });
      }

      return tx.careerQuizQuestion.findUniqueOrThrow({
        where: { id: questionId },
        include: questionInclude,
      });
    });
  }

  async removeQuestion(questionId: string) {
    const row = await this.prisma.careerQuizQuestion.findUnique({
      where: { id: questionId },
    });
    if (!row) {
      throw new NotFoundException();
    }
    await this.prisma.careerQuizQuestion.delete({ where: { id: questionId } });
  }
}

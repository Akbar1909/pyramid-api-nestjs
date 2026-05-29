import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CareerQuizService } from './career-quiz.service';
import { CreateCareerQuizQuestionDto } from './dto/create-career-quiz-question.dto';
import { CreateCareerQuizDto } from './dto/create-career-quiz.dto';
import { UpdateCareerQuizQuestionDto } from './dto/update-career-quiz-question.dto';
import { UpdateCareerQuizDto } from './dto/update-career-quiz.dto';

@ApiTags('Career quiz')
@Controller('career-quiz')
export class CareerQuizController {
  constructor(private readonly careerQuiz: CareerQuizService) {}

  @Get('published')
  @ApiOperation({
    summary: 'Get published career quiz (public)',
    description:
      'Returns the most recently updated published quiz with questions and options ordered for the visitor flow.',
  })
  findPublished() {
    return this.careerQuiz.findPublished();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all career quizzes (admin)' })
  findAllAdmin() {
    return this.careerQuiz.findAllAdmin();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create career quiz (admin)' })
  create(@Body() dto: CreateCareerQuizDto) {
    return this.careerQuiz.create(dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get career quiz with questions (admin)' })
  findOneAdmin(@Param('id') id: string) {
    return this.careerQuiz.findOneAdmin(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update career quiz (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateCareerQuizDto) {
    return this.careerQuiz.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete career quiz and all questions (admin)' })
  async remove(@Param('id') id: string) {
    await this.careerQuiz.remove(id);
  }

  @Post(':id/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Add question with options (admin)',
    description:
      'Exactly three options (A, B, C) plus `correctOptionIndex` (0–2). `stepOrder` must be unique within the quiz.',
  })
  createQuestion(
    @Param('id') quizId: string,
    @Body() dto: CreateCareerQuizQuestionDto,
  ) {
    return this.careerQuiz.createQuestion(quizId, dto);
  }

  @Patch('questions/:questionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update question (admin)',
    description:
      'When sending `options`, send exactly three entries and `correctOptionIndex` (0–2). Omit both to leave choices unchanged.',
  })
  updateQuestion(
    @Param('questionId') questionId: string,
    @Body() dto: UpdateCareerQuizQuestionDto,
  ) {
    return this.careerQuiz.updateQuestion(questionId, dto);
  }

  @Delete('questions/:questionId')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete question and its options (admin)' })
  async removeQuestion(@Param('questionId') questionId: string) {
    await this.careerQuiz.removeQuestion(questionId);
  }
}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CareerQuizController } from './career-quiz.controller';
import { CareerQuizService } from './career-quiz.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CareerQuizController],
  providers: [CareerQuizService],
})
export class CareerQuizModule {}

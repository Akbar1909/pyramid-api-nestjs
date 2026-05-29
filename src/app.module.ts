import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';
import { FilesModule } from './files/files.module';
import { NewsModule } from './news/news.module';
import { ProfileModule } from './profile/profile.module';
import { TourBookingsModule } from './tour-bookings/tour-bookings.module';
import { CareerQuizModule } from './career-quiz/career-quiz.module';
import { FacultyProgramsModule } from './faculty-programs/faculty-programs.module';
import { ProgramApplicationsModule } from './program-applications/program-applications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProfileModule,
    EventsModule,
    NewsModule,
    FilesModule,
    TourBookingsModule,
    CareerQuizModule,
    FacultyProgramsModule,
    ProgramApplicationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

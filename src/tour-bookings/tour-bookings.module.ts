import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TourBookingsController } from './tour-bookings.controller';
import { TourBookingsService } from './tour-bookings.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TourBookingsController],
  providers: [TourBookingsService],
})
export class TourBookingsModule {}

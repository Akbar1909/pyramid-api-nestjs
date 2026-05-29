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
import { Role, User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalCurrentUser } from '../auth/decorators/optional-current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsService } from './news.service';

@ApiTags('News')
@Controller('news')
export class NewsController {
  constructor(private readonly news: NewsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List news',
    description:
      'No auth: published articles only. Valid admin JWT: includes drafts and scheduled posts.',
  })
  findAll(@OptionalCurrentUser() user?: User) {
    return this.news.findAll(user);
  }

  @Get('article/:slugOrId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get news by slug or id',
    description:
      'Resolves a published article by unique `slug`, or by `id` if no slug matches. No auth: published only.',
  })
  findArticle(
    @Param('slugOrId') slugOrId: string,
    @OptionalCurrentUser() user?: User,
  ) {
    return this.news.findPublishedBySlugOrId(slugOrId, user);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get news by id',
    description:
      'No auth: published only. Admin JWT: may load drafts or scheduled items.',
  })
  findOne(@Param('id') id: string, @OptionalCurrentUser() user?: User) {
    return this.news.findOne(id, user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create news (admin)' })
  create(@CurrentUser() user: User, @Body() dto: CreateNewsDto) {
    return this.news.create(user, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update news (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateNewsDto) {
    return this.news.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete news (admin)' })
  async remove(@Param('id') id: string) {
    await this.news.remove(id);
  }
}

import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateExamDto } from './dto/create-exam.dto';
import { ExamService } from './exam.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('exam')
@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post()
  @ApiOperation({ summary: '시험 정보 등록' })
  create(@Body() createExamDto: CreateExamDto) {
    return this.examService.create(createExamDto);
  }

  // 공개 API
  @Get(':userId')
  @ApiOperation({ summary: '사용자의 시험 정보 조회' })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  findByUser(@Param('userId') userId: string) {
    return this.examService.findByUser(userId);
  }

  // JWT 보호 적용
  // @Get(':userId')
  // @UseGuards(JwtAuthGuard) 
  // @ApiBearerAuth('access-tocken')         
  // @ApiOperation({ summary: '사용자의 시험 정보 조회 (보호됨)' })
  // @ApiParam({ name: 'userId', description: '사용자 ID' })
  // findByUser(@Param('userId') userId: string) {
  //   return this.examService.findByUser(userId);
  // }
}
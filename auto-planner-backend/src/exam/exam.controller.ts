import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateExamDto } from './dto/create-exam.dto';
import { ExamService } from './exam.service';

@ApiTags('exam')
@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post()
  @ApiOperation({ summary: '시험 정보 등록' })
  create(@Body() createExamDto: CreateExamDto) {
    return this.examService.create(createExamDto);
  }

  @Get(':userId')
  @ApiOperation({ summary: '사용자의 시험 정보 조회' })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  findByUser(@Param('userId') userId: string) {
    return this.examService.findByUser(userId);
  }
}

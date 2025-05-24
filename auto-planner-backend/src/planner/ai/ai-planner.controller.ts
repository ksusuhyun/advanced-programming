import { Controller, Post, Body } from '@nestjs/common';
import { AiPlannerService } from './ai-planner.service';
import { AiGeneratePlanDto } from './dto/ai-planner.dto';
import { SyncToNotionDto } from '../../notion/dto/sync-to-notion.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
} from '@nestjs/swagger';

@ApiTags('ai-plan')
@Controller('ai-plan')
export class AiPlannerController {
  constructor(private readonly aiPlannerService: AiPlannerService) {}

  @Post('/generate')
  @ApiOperation({ summary: 'GPT 기반 학습 계획 생성' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: {
          type: 'string',
          example: 'user123',
          description: '사용자 ID',
        },
      },
    },
  })
  @ApiOkResponse({
    description: '생성된 학습 계획 목록',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          subject: { type: 'string', example: '수학' },
          startDate: { type: 'string', example: '2025-06-01' },
          endDate: { type: 'string', example: '2025-06-15' },
          dailyPlan: {
            type: 'array',
            items: { type: 'string', example: '6/1: 수열의 개념' },
          },
        },
      },
    },
  })
  async generatePlan(@Body() body: AiGeneratePlanDto) {
    return this.aiPlannerService.generateStudyPlanByUserId(body.userId);
  }
}
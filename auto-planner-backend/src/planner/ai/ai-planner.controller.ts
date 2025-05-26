import { Controller, Post, Body } from '@nestjs/common';
import { AiPlannerService } from './ai-planner.service';
import { ApiTags, ApiOperation, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { SyncToNotionDto } from '../../notion/dto/sync-to-notion.dto';

@ApiTags('ai-plan')
@Controller('ai-plan')
export class AiPlannerController {
  constructor(private readonly aiPlannerService: AiPlannerService) {}

  @Post('/generate')
  @ApiOperation({
    summary: '학습 계획 생성 (LLM 제외)',
    description: '유저 ID 기반으로 내부 rule engine을 사용하여 학습 계획을 생성하고 Notion에 동기화합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: {
          type: 'string',
          example: '202255150',
        },
      },
    },
  })
  @ApiOkResponse({
    description: '성공적으로 생성된 학습 계획',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          subject: { type: 'string', example: '시계열분석' },
          startDate: { type: 'string', example: '2025-05-23' },
          endDate: { type: 'string', example: '2025-06-11' },
          userId: { type: 'string', example: '202255150' },
          databaseId: { type: 'string', example: 'notion-db-id' },
          dailyPlan: {
            type: 'array',
            items: { type: 'string', example: '6/1: Chapter 1 (p.1-10)' },
          },
        },
      },
    },
  })
  async generatePlan(@Body() body: { userId: string }): Promise<SyncToNotionDto[]> {
    return this.aiPlannerService.generateStudyPlan(body.userId);
  }
}

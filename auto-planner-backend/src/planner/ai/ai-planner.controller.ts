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

  // ai-planner.controller.ts
  @Post('/generate')
  @ApiOperation({
    summary: 'GPT 기반 학습 계획 생성',
    description: `사용자의 시험 정보 및 preference를 기반으로 LLM(FastAPI) 또는 내부 rule engine을 활용하여 학습 계획을 생성합니다.
  LLM 호출이 실패하거나 비활성화된 경우, 내부 TypeScript 로직으로 fallback 처리됩니다.`,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: {
          type: 'string',
          example: 'user123',
          description: '사용자 고유 ID',
        },
      },
    },
  })
  @ApiOkResponse({
    description: `생성된 학습 계획 목록 (Notion에 동기화됨). 
  응답은 JSON 배열이며, 각 항목은 { subject, date, content } 형식입니다.`,
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          subject: { type: 'string', example: '의료기기인허가' },
          startDate: { type: 'string', example: '2025-06-01' },
          endDate: { type: 'string', example: '2025-06-15' },
          dailyPlan: {
            type: 'array',
            items: { type: 'string', example: '6/1: Chapter 7 (p.1-10)' },
          },
          databaseId: { type: 'string', example: 'notion-db-id-abc123' },
        },
      },
    },
  })
  async generatePlan(@Body() body: AiGeneratePlanDto): Promise<SyncToNotionDto[]> {
    return this.aiPlannerService.generateStudyPlanByUserId(body.userId);
  }

}

import { Controller, Post, Body } from '@nestjs/common';
import { AiPlannerService } from './ai-planner.service';
import { AiGeneratePlanDto } from './dto/generate-plan.dto'; // 사용자 입력 DTO
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('ai-plan') // Swagger 문서 그룹 이름
@Controller('ai-plan') // 실제 라우트 경로: /ai-plan
export class AiPlannerController {
  constructor(private readonly aiPlannerService: AiPlannerService) {}

  @Post('/generate')
  @ApiOperation({ summary: 'GPT 기반 학습 계획 생성' })
  @ApiBody({ type: AiGeneratePlanDto })
  async generatePlan(@Body() dto: AiGeneratePlanDto) {
    return this.aiPlannerService.generateStudyPlan(dto);
  }
}

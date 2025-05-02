import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { PlannerService } from './planner.service';
import { ConfirmPlanDto } from './dto/confirm-plan.dto';

@ApiTags('planner')
@Controller('planner')
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

  @Post('generate')
  @ApiOperation({ summary: '공부 계획 생성 요청' })
  generatePlan(@Body() dto: GeneratePlanDto) {
    return this.plannerService.generatePlan(dto);
  }

  @Post('confirm')
    @ApiOperation({ summary: '공부 계획 확정 및 Notion 전송' })
    confirmPlan(@Body() dto: ConfirmPlanDto) {
    return this.plannerService.confirmPlan(dto);
    }
}

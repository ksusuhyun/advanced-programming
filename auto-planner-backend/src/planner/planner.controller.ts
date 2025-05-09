import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { PlannerService } from './planner.service';
import { ConfirmPlanDto } from './dto/confirm-plan.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('planner')
@Controller('planner')
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: '확정할 계획 ID' })
  @ApiOperation({ summary: '공부 계획 확정 및 Notion 연동 (mock)' })
  confirmPlan(
    @Param('id') id: string,
    @Body() dto: ConfirmPlanDto,
  ) {
    return this.plannerService.confirmPlan(id, dto);
  }
}

// ai 관련 기능만 담당하는 모듈
import { Module } from '@nestjs/common';
import { AiPlannerService } from './ai-planner.service';
import { AiPlannerController } from './ai-planner.controller';

@Module({
  controllers: [AiPlannerController],
  providers: [AiPlannerService],
})
export class AiModule {}
// AiModule : ai 관련 기능만 담당하는 모듈로, AiPlannerService와 AiPlannerController를 등록

import { AiPlannerService } from './ai-planner.service';
import { AiGeneratePlanDto } from './dto/generate-plan.dto';
export declare class AiPlannerController {
    private readonly aiPlannerService;
    constructor(aiPlannerService: AiPlannerService);
    generatePlan(dto: AiGeneratePlanDto): Promise<any>;
}

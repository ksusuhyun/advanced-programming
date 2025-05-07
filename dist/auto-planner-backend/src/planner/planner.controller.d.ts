import { GeneratePlanDto } from './dto/generate-plan.dto';
import { PlannerService } from './planner.service';
import { ConfirmPlanDto } from './dto/confirm-plan.dto';
export declare class PlannerController {
    private readonly plannerService;
    constructor(plannerService: PlannerService);
    generatePlan(dto: GeneratePlanDto): {
        message: string;
        promptSentToAPI: string;
        generatedPlan: string;
    };
    confirmPlan(dto: ConfirmPlanDto): {
        message: string;
        dataForNotion: ConfirmPlanDto;
    };
}

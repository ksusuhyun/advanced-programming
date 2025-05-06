import { GeneratePlanDto } from './dto/generate-plan.dto';
import { ConfirmPlanDto } from './dto/confirm-plan.dto';
export declare class PlannerService {
    generatePlan(dto: GeneratePlanDto): {
        message: string;
        promptSentToAPI: string;
        generatedPlan: string;
    };
    private _generatePrompt;
    confirmPlan(dto: ConfirmPlanDto): {
        message: string;
        dataForNotion: ConfirmPlanDto;
    };
}

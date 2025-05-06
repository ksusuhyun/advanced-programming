import { AiGeneratePlanDto } from './dto/generate-plan.dto';
import { ConfigService } from '@nestjs/config';
export declare class AiPlannerService {
    private readonly configService;
    constructor(configService: ConfigService);
    generateStudyPlan(dto: AiGeneratePlanDto): Promise<any>;
    private createPrompt;
}

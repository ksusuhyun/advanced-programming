import { AiPlannerService } from './ai-planner.service';
import { SyncToNotionDto } from '../../notion/dto/sync-to-notion.dto';
export declare class AiPlannerController {
    private readonly aiPlannerService;
    constructor(aiPlannerService: AiPlannerService);
    generatePlan(body: {
        userId: string;
    }): Promise<SyncToNotionDto[]>;
}

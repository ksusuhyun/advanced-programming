import { ConfigService } from '@nestjs/config';
import { UserPreferenceService } from '../../user-preference/user-preference.service';
import { ExamService } from '../../exam/exam.service';
export declare class AiPlannerService {
    private readonly configService;
    private readonly userPreferenceService;
    private readonly examService;
    constructor(configService: ConfigService, userPreferenceService: UserPreferenceService, examService: ExamService);
    generateStudyPlan(userId: string, databaseIdOverride?: string): Promise<any[]>;
    private buildPrompt;
    private callLlamaAPI;
}

import { ConfigService } from '@nestjs/config';
import { UserPreferenceService } from '../../user-preference/user-preference.service';
import { ExamService } from '../../exam/exam.service';
import { SyncToNotionDto } from '../../notion/dto/sync-to-notion.dto';
import { NotionService } from '../../notion/notion.service';
import { LlmClientService } from '../server/llm-client.service';
export declare class AiPlannerService {
    private readonly configService;
    private readonly userPreferenceService;
    private readonly examService;
    private readonly notionService;
    private readonly llmClient;
    constructor(configService: ConfigService, userPreferenceService: UserPreferenceService, examService: ExamService, notionService: NotionService, llmClient: LlmClientService);
    generateStudyPlanByUserId(userId: string): Promise<SyncToNotionDto[]>;
    private estimateDaysByDifficulty;
    private assignChaptersFallback;
    private mapResponseForClient;
    private groupDailyPlansBySubject;
    private mergeSubjects;
}

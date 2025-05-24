import { ConfigService } from '@nestjs/config';
import { SyncToNotionDto } from './dto/sync-to-notion.dto';
export declare class NotionService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    private getClientForUser;
    addPlanEntry(data: {
        userId: string;
        subject: string;
        date: string;
        content: string;
        databaseId: string;
    }): Promise<import("@notionhq/client/build/src/api-endpoints").CreatePageResponse>;
    syncToNotion(dto: SyncToNotionDto): Promise<{
        message: string;
        count: number;
    }>;
}

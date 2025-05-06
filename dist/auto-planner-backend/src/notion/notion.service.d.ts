import { SyncToNotionDto } from './dto/sync-to-notion.dto';
export declare class NotionService {
    syncToNotion(dto: SyncToNotionDto): {
        message: string;
        syncedData: SyncToNotionDto;
    };
}

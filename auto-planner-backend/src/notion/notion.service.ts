import { Injectable } from '@nestjs/common';
import { SyncToNotionDto } from './dto/sync-to-notion.dto';

@Injectable()
export class NotionService {
  syncToNotion(dto: SyncToNotionDto) {
    // 실제 Notion API 연동 대신 모의 응답
    return {
      message: 'Notion에 일정이 전송되었습니다 (Mock)',
      syncedData: dto
    };
  }
}

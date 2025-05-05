import { Injectable } from '@nestjs/common';
import { Client } from '@notionhq/client';
import { SyncToNotionDto } from './dto/sync-to-notion.dto';

@Injectable()
export class NotionService {
  private notion = new Client({
    auth: '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', // 실제 코드에서는 .env 사용 권장
  });

  private databaseId = '1ea4fa76f8688090ae04fed52a6e3ca7';

  async addPlanEntry(data: {
    userId: string;
    subject: string;
    date: string;
    content: string;
  }) {
    return await this.notion.pages.create({
      parent: { database_id: this.databaseId },
      properties: {
        Subject: {
          title: [{ text: { content: data.subject } }],
        },
        'User ID': {
          rich_text: [{ text: { content: data.userId } }],
        },
        Date: {
          date: { start: data.date },
        },
        Content: {
          rich_text: [{ text: { content: data.content } }],
        },
      },
    });
  }

  async syncToNotion(dto: SyncToNotionDto) {
    for (const entry of dto.dailyPlan) {
      const [date, content] = entry.split(':').map((v) => v.trim());
      await this.addPlanEntry({
        userId: dto.userId,
        subject: dto.subject,
        date: `2025-${date.replace('/', '-')}`,
        content,
      });
    }

    return { message: '노션 연동 완료', count: dto.dailyPlan.length };
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // ✅ 추가
import { Client } from '@notionhq/client';
import { SyncToNotionDto } from './dto/sync-to-notion.dto';

@Injectable()
export class NotionService {
  private notion: Client;
  private databaseId: string;

  constructor(private configService: ConfigService) {
    this.notion = new Client({
      auth: this.configService.get<string>('NOTION_TOKEN'), // ✅ .env에서 토큰 불러오기
    });

    this.databaseId = this.configService.get<string>('DATABASE_ID') ?? 'default-id';
  }

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


// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { Client } from '@notionhq/client';
// import { SyncToNotionDto } from './dto/sync-to-notion.dto';
// import { getToken } from 'src/auth/notion-token.store';
// import { parse, format } from 'date-fns';

// @Injectable()
// export class NotionService {
//   private readonly defaultDatabaseId: string;

//   constructor(private readonly configService: ConfigService) {
//     this.defaultDatabaseId = this.configService.get<string>('DATABASE_ID') ?? 'default-id';
//   }

//   // private getClientForUser(userId: string): Client {
//   //   const userToken = getToken(userId);
//   //   if (!userToken) {
//   //     throw new Error(`❌ Notion token not found for user ${userId}`);
//   //   }
//   //   return new Client({ auth: userToken });
//   // }

//   async addPlanEntry(data: {
//     // userId: string;
//     subject: string;
//     date: string;
//     content: string;
//     databaseId: string;
//   }) {
//     // const notion = this.getClientForUser(data.userId); 아래 수정된 코드
//     const notion = new Client({
//   auth: this.configService.get<string>('NOTION_TOKEN'), // .env에 고정된 토큰 사용
// });


//     return await notion.pages.create({
//       parent: { database_id: data.databaseId },
//       properties: {
//         Subject: {
//           title: [{ text: { content: data.subject } }],
//         },
//         // 'User ID': {
//         //   rich_text: [{ text: { content: data.userId } }],
//         // },
//         Date: {
//           date: { start: data.date },
//         },
//         Content: {
//           rich_text: [{ text: { content: data.content } }],
//         },
//       },
//     });
//   }

 

//   async syncToNotion(dto: SyncToNotionDto) {
//     for (const entry of dto.dailyPlan) {
//       const [date, content] = entry.split(':').map((v) => v.trim());
//       // dto.startDate의 연도에서 가져옴.
//       const parsed = parse(date, 'M/d', new Date(dto.startDate));
//       const formattedDate = format(parsed, 'yyyy-MM-dd');

//       await this.addPlanEntry({
//         // userId: dto.userId,
//         subject: dto.subject,
//         date: formattedDate,
//         content,
//         databaseId: dto.databaseId,
//       });
//     }

//     return {
//       message: '📌 노션 연동 완료',
//       count: dto.dailyPlan.length,
//     };
//   }
// }


// // import { Injectable } from '@nestjs/common';
// // import { ConfigService } from '@nestjs/config'; // ✅ 추가
// // import { Client } from '@notionhq/client';
// // import { SyncToNotionDto } from './dto/sync-to-notion.dto';
// // import { format } from 'date-fns';
// // import { getToken } from 'src/auth/notion-token.store';

// // @Injectable()
// // export class NotionService {
// //   private notion: Client;
// //   private databaseId: string;

// //   constructor(private configService: ConfigService) {
// //     this.notion = new Client({
// //       auth: this.configService.get<string>('NOTION_TOKEN'), // ✅ .env에서 토큰 불러오기
// //     });

// //     this.databaseId = this.configService.get<string>('DATABASE_ID') ?? 'default-id';
// //   }

// //   async addPlanEntry(data: {
// //     userId: string;
// //     subject: string;
// //     date: string;
// //     content: string;
// //   }) {
// //     return await this.notion.pages.create({
// //       parent: { database_id: this.databaseId },
// //       properties: {
// //         Subject: {
// //           title: [{ text: { content: data.subject } }],
// //         },
// //         'User ID': {
// //           rich_text: [{ text: { content: data.userId } }],
// //         },
// //         Date: {
// //           date: { start: data.date },
// //         },
// //         Content: {
// //           rich_text: [{ text: { content: data.content } }],
// //         },
// //       },
// //     });
// //   }

// //   async syncToNotion(dto: SyncToNotionDto) {
// //     for (const entry of dto.dailyPlan) {
// //       const [date, content] = entry.split(':').map((v) => v.trim());
// //       await this.addPlanEntry({
// //         userId: dto.userId,
// //         subject: dto.subject,
// //         date: `2025-${date.replace('/', '-')}`,
// //         content,
// //       });
// //     }

// //     return { message: '노션 연동 완료', count: dto.dailyPlan.length };
// //   }

// //   async saveScheduleToNotion(userId: string, schedule: any[]) {
// //     const calendarId = this.configService.get<string>('NOTION_CALENDAR_ID');
// //     if (!calendarId) throw new Error('Notion 캘린더 ID가 설정되지 않았습니다.');

// //     for (const entry of schedule) {
// //       await this.notion.pages.create({
// //         parent: { database_id: calendarId },
// //         properties: {
// //           Name: {
// //             title: [
// //               {
// //                 text: {
// //                   content: `Day ${entry.day} 학습`,
// //                 },
// //               },
// //             ],
// //           },
// //           Date: {
// //             date: {
// //               start: entry.date,
// //             },
// //           },
// //           Tasks: {
// //             rich_text: [
// //               {
// //                 text: {
// //                   content: entry.tasks.join(', '),
// //                 },
// //               },
// //             ],
// //           },
// //           User: {
// //             rich_text: [
// //               {
// //                 text: {
// //                   content: userId,
// //                 },
// //               },
// //             ],
// //           },
// //         },
// //       });
// //     }

// //     return { message: 'Notion 일정 등록 완료' };
// //   }
// // }


import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@notionhq/client';
import { parse, format } from 'date-fns';
import { getToken } from 'src/auth/notion-token.store';
import { SyncToNotionDto } from './dto/sync-to-notion.dto';


@Injectable()
export class NotionService {
  private readonly logger = new Logger(NotionService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * 사용자 access_token 기반 Notion 클라이언트 생성
   */
  private getClientForUser(userId: string): Client {
    const token = getToken(userId);
    // ✅ DEBUG 로그 (출력 안 되는 경우, getToken 자체 확인 필요)
    console.log('🔐 실제 사용될 토큰:', token);
    this.logger.log(`🔑 Loaded token for user ${userId}: ${token}`);

    if (!token) {
      throw new Error(`❌ Notion token not found for user: ${userId}`);
    }
    return new Client({ auth: token });
  }
    /**
     * Notion DB 초기화: 기존 페이지 soft delete (archive)
     */
    // async clearDatabase(userId: string, databaseId: string) {
    //   const notion = this.getClientForUser(userId);
    //   const pages = await notion.databases.query({ database_id: databaseId });

    //   for (const page of pages.results) {
    //     await notion.pages.update({ page_id: page.id, archived: true });
    //   }
    // }
    /**
   * 계획 하나를 Notion에 추가
   */
  async addPlanEntry(data: {
    userId: string;
    subject: string;
    date: string;
    content: string;
    databaseId: string;
  }) {
    const notion = this.getClientForUser(data.userId);
    // const userToken = getToken(data.userId);
    // if (!userToken) {
    //   throw new Error(`[❌ Notion 토큰 없음] userId: ${data.userId}`);
    // }

    // const notion = new Client({ auth: userToken });


    return await notion.pages.create({
      parent: { database_id: data.databaseId },
      properties: {
        Subject: {
          title: [{ text: { content: data.subject } }],
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

  /**
   * 전체 일정을 Notion에 동기화
   */
  async syncToNotion(dto: SyncToNotionDto) {
    // await this.clearDatabase(dto.userId, dto.databaseId);
    // 날짜+과목 기준으로 챕터 묶기
    const grouped = new Map<string, { date: string; contentList: string[] }>();

    // ✨ 이 부분 교체(Notion에 페이지수가 반영되지 않는 부분해결)
    for (const entry of dto.dailyPlan) {
      const colonIndex = entry.indexOf(':');
      const dateRaw = entry.slice(0, colonIndex).trim();
      const content = entry.slice(colonIndex + 1).trim();

      // 날짜가 이미 'yyyy-MM-dd' 형식이면 그대로 사용
      const formattedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw)
        ? dateRaw
        : format(parse(dateRaw, 'M/d', new Date(dto.startDate)), 'yyyy-MM-dd');

      const key = `${dto.subject}_${formattedDate}`;
      if (!grouped.has(key)) {
        grouped.set(key, { date: formattedDate, contentList: [] });
      }
      grouped.get(key)!.contentList.push(content);
    }


    // 각 그룹에 대해 Notion entry 생성
    for (const { date, contentList } of grouped.values()) {
      await this.addPlanEntry({
        userId: dto.userId,
        subject: dto.subject,
        date,
        content: contentList.join(', '), // 하나의 셀에 ,로 이어붙임
        databaseId: dto.databaseId,
      });
    }

    return {
      message: '📌 Notion 연동 완료',
      count: grouped.size, // 실제로 작성된 row 개수
    };
  }

  async saveFeedbackToNotion(userId: string, title: string, content: string) {
    const notion = this.getClientForUser(userId);
    const databaseId = this.configService.get<string>('DATABASE_ID');
    if (!databaseId) throw new Error('❌ DATABASE_ID 누락');

    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Subject: {
          title: [{ text: { content: title } }],
        },
        Date: {
          date: { start: new Date().toISOString().split('T')[0] },
        },
        Content: {
          rich_text: [{ text: { content } }],
        },
      },
    });
  }

//   async deleteByUserAndDatabase(userId: string, databaseId: string): Promise<void> {
//   // 이 부분은 실제 Notion API로 구현 필요
//   // 예: Notion DB에서 userId가 같은 row를 쿼리 후 삭제
//   const pages = await this.queryPagesByUser(userId, databaseId);

//   for (const page of pages) {
//     await this.deletePageById(page.id);
//   }
// }
//   async queryPagesByUser(userId: string, databaseId: string): Promise<{ id: string }[]> {
//     // 필터: databaseId에서 userId property가 일치하는 row 찾기
//     const response = await this.notionClient.databases.query({
//       database_id: databaseId,
//       filter: {
//         property: 'userId',
//         rich_text: {
//           equals: userId,
//         },
//       },
//     });

//     return response.results.map((r: any) => ({ id: r.id }));
//   }

//   async deletePageById(pageId: string): Promise<void> {
//     await this.notionClient.pages.update({
//       page_id: pageId,
//       archived: true,
//     });
// }

}




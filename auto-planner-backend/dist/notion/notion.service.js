"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@notionhq/client");
let NotionService = class NotionService {
    configService;
    notion;
    databaseId;
    constructor(configService) {
        this.configService = configService;
        this.notion = new client_1.Client({
            auth: this.configService.get('NOTION_TOKEN'),
        });
        this.databaseId = this.configService.get('DATABASE_ID') ?? 'default-id';
    }
    async addPlanEntry(data) {
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
    async syncToNotion(dto) {
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
    async saveScheduleToNotion(userId, schedule) {
        const calendarId = this.configService.get('NOTION_CALENDAR_ID');
        if (!calendarId)
            throw new Error('Notion 캘린더 ID가 설정되지 않았습니다.');
        for (const entry of schedule) {
            await this.notion.pages.create({
                parent: { database_id: calendarId },
                properties: {
                    Name: {
                        title: [
                            {
                                text: {
                                    content: `Day ${entry.day} 학습`,
                                },
                            },
                        ],
                    },
                    Date: {
                        date: {
                            start: entry.date,
                        },
                    },
                    Tasks: {
                        rich_text: [
                            {
                                text: {
                                    content: entry.tasks.join(', '),
                                },
                            },
                        ],
                    },
                    User: {
                        rich_text: [
                            {
                                text: {
                                    content: userId,
                                },
                            },
                        ],
                    },
                },
            });
        }
        return { message: 'Notion 일정 등록 완료' };
    }
};
exports.NotionService = NotionService;
exports.NotionService = NotionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], NotionService);
//# sourceMappingURL=notion.service.js.map
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
exports.AiPlannerService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const config_1 = require("@nestjs/config");
let AiPlannerService = class AiPlannerService {
    constructor(configService) {
        this.configService = configService;
    }
    async generateStudyPlan(dto) {
        const prompt = this.createPrompt(dto);
        const apiKey = this.configService.get('OPENAI_API_KEY');
        const model = this.configService.get('OPENAI_MODEL') || 'gpt-3.5-turbo';
        try {
            const response = await axios_1.default.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a helpful study planner.' },
                    { role: 'user', content: prompt },
                ],
            }, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            });
            const content = response.data.choices[0].message.content;
            console.log('[GPT 응답]', content);
            return JSON.parse(content);
        }
        catch (error) {
            console.error('[🔥 GPT 호출 오류]', error.response?.data || error.message);
            throw new common_1.InternalServerErrorException('AI 응답 처리 중 오류 발생');
        }
    }
    createPrompt(dto) {
        const chapters = dto.chapters
            .map((ch, i) => `Chapter ${i + 1}: "${ch.chapterTitle}", Difficulty: ${ch.difficulty}, Volume: ${ch.contentVolume}`)
            .join('\n');
        return `
Generate a study plan in JSON format.

Subject: ${dto.subject}
Study period: ${dto.startDate} to ${dto.endDate}
Importance: ${dto.importance}/5
Chapters:
${chapters}

Please return a day-by-day plan in JSON. Do not include explanation.
`;
    }
};
exports.AiPlannerService = AiPlannerService;
exports.AiPlannerService = AiPlannerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiPlannerService);
//# sourceMappingURL=ai-planner.service.js.map
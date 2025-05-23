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
const config_1 = require("@nestjs/config");
const user_preference_service_1 = require("../../user-preference/user-preference.service");
const exam_service_1 = require("../../exam/exam.service");
const llm_client_service_1 = require("./llm-client.service");
const notion_service_1 = require("../../notion/notion.service");
const PAGE_LIMIT_BY_DIFFICULTY = {
    '상': 5,
    '중': 10,
    '하': 15,
};
let AiPlannerService = class AiPlannerService {
    configService;
    userPreferenceService;
    examService;
    llmClient;
    notionService;
    constructor(configService, userPreferenceService, examService, llmClient, notionService) {
        this.configService = configService;
        this.userPreferenceService = userPreferenceService;
        this.examService = examService;
        this.llmClient = llmClient;
        this.notionService = notionService;
    }
    async generateStudyPlanByUserId(userId) {
        const preference = await this.userPreferenceService.findByUserId(userId);
        const { exams } = await this.examService.findByUser(userId);
        if (!preference || !exams || exams.length === 0) {
            throw new common_1.InternalServerErrorException('❌ 유저 정보 또는 시험 데이터가 부족합니다.');
        }
        const mergedSubjects = this.mergeSubjects(exams);
        const slices = this.flattenChapters(mergedSubjects);
        const prompt = this.createPromptFromSlices(slices, preference);
        const raw = await this.llmClient.generate(prompt);
        const databaseId = this.configService.get('DATABASE_ID');
        if (!databaseId)
            throw new common_1.InternalServerErrorException('❌ DATABASE_ID 누락');
        return this.groupDailyPlansBySubject(userId, databaseId, mergedSubjects, raw);
    }
    groupDailyPlansBySubject(userId, databaseId, subjects, llmResponse) {
        const grouped = {};
        for (const item of llmResponse) {
            if (!grouped[item.subject]) {
                grouped[item.subject] = [];
            }
            grouped[item.subject].push(`${item.date}: ${item.content}`);
        }
        return Object.entries(grouped).map(([subject, dailyPlan]) => {
            const matchedSubject = subjects.find((s) => s.subject === subject);
            if (!matchedSubject)
                throw new Error(`❌ 과목 일치 실패: ${subject}`);
            return {
                userId,
                subject,
                startDate: matchedSubject.startDate,
                endDate: matchedSubject.endDate,
                dailyPlan,
                databaseId,
            };
        });
    }
    mergeSubjects(exams) {
        const grouped = {};
        for (const exam of exams) {
            const key = exam.subject;
            if (!grouped[key]) {
                grouped[key] = {
                    subject: exam.subject,
                    startDate: exam.startDate,
                    endDate: exam.endDate,
                    chapters: [...exam.chapters],
                };
            }
            else {
                grouped[key].startDate = new Date(exam.startDate) < new Date(grouped[key].startDate)
                    ? exam.startDate
                    : grouped[key].startDate;
                grouped[key].endDate = new Date(exam.endDate) > new Date(grouped[key].endDate)
                    ? exam.endDate
                    : grouped[key].endDate;
                grouped[key].chapters.push(...exam.chapters);
            }
        }
        return Object.values(grouped);
    }
    sliceChapter(chapter) {
        const { chapterTitle, contentVolume, difficulty } = chapter;
        const limit = PAGE_LIMIT_BY_DIFFICULTY[difficulty] ?? 10;
        const slices = [];
        let pageStart = 1;
        while (pageStart <= contentVolume) {
            const pageEnd = Math.min(pageStart + limit - 1, contentVolume);
            slices.push({
                title: chapterTitle,
                pageRange: `(p.${pageStart}-${pageEnd})`,
                subject: '',
            });
            pageStart = pageEnd + 1;
        }
        return slices;
    }
    flattenChapters(subjects) {
        const slices = [];
        for (const subject of subjects) {
            for (const chapter of subject.chapters) {
                const chapterSlices = this.sliceChapter(chapter);
                slices.push(...chapterSlices.map(slice => ({ ...slice, subject: subject.subject })));
            }
        }
        return slices;
    }
    createPromptFromSlices(slices, pref) {
        const lines = [
            '# You are a planner assistant.',
            '# Given the list of chapter slices, assign them to study days within the allowed period.',
            `# Each day can contain up to ${pref.sessionsPerDay} items.`,
            `# Use only the allowed weekdays: ${pref.studyDays.join(', ')}`,
            '# Output only JSON array like:',
            '# [{ "subject": "...", "date": "6/1", "content": "챕터명 (p.1-5)" }, ...]',
            '',
            'Slices:'
        ];
        lines.push(...slices.map((s, i) => `${i + 1}. ${s.subject} - ${s.title} ${s.pageRange}`));
        return lines.join('\n');
    }
};
exports.AiPlannerService = AiPlannerService;
exports.AiPlannerService = AiPlannerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        user_preference_service_1.UserPreferenceService,
        exam_service_1.ExamService,
        llm_client_service_1.LLMClientService,
        notion_service_1.NotionService])
], AiPlannerService);
//# sourceMappingURL=ai-planner.service.js.map
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
const notion_service_1 = require("../../notion/notion.service");
const llm_client_service_1 = require("../server/llm-client.service");
const date_fns_1 = require("date-fns");
let AiPlannerService = class AiPlannerService {
    configService;
    userPreferenceService;
    examService;
    notionService;
    llmClient;
    constructor(configService, userPreferenceService, examService, notionService, llmClient) {
        this.configService = configService;
        this.userPreferenceService = userPreferenceService;
        this.examService = examService;
        this.notionService = notionService;
        this.llmClient = llmClient;
    }
    async generateStudyPlanByUserId(userId) {
        const preference = await this.userPreferenceService.findByUserId(userId);
        const style = await this.userPreferenceService.getStyle(userId);
        const { exams } = await this.examService.findByUser(userId);
        if (!preference || !exams || exams.length === 0) {
            throw new common_1.InternalServerErrorException('❌ 유저 정보 또는 시험 데이터가 부족합니다.');
        }
        const databaseId = this.configService.get('DATABASE_ID');
        if (!databaseId)
            throw new common_1.InternalServerErrorException('❌ DATABASE_ID 누락');
        const mergedSubjects = this.mergeSubjects(exams);
        const slices = this.flattenChapters(mergedSubjects);
        const dates = this.getAllStudyDates(mergedSubjects, preference.studyDays);
        const prompt = this.createPromptWithConstraints(slices, dates, preference, style);
        const llmResult = await this.llmClient.generate(prompt);
        if (!Array.isArray(llmResult))
            throw new Error('❌ LLM 응답 오류');
        const results = this.groupDailyPlansBySubject(userId, databaseId, mergedSubjects, llmResult);
        for (const result of results)
            await this.notionService.syncToNotion(result);
        return this.mapResponseForClient(results);
    }
    mapResponseForClient(results) {
        return results.map(({ subject, startDate, endDate, dailyPlan }) => ({
            subject,
            startDate,
            endDate,
            dailyPlan,
        }));
    }
    groupDailyPlansBySubject(userId, databaseId, subjects, llmResponse) {
        const groupedBySubject = {};
        for (const item of llmResponse) {
            const subjectKey = item.subject;
            if (!groupedBySubject[subjectKey]) {
                const matched = subjects.find(s => s.subject === subjectKey);
                if (!matched)
                    throw new Error(`❌ 과목 일치 실패: ${subjectKey}`);
                groupedBySubject[subjectKey] = {
                    userId,
                    subject: subjectKey,
                    startDate: matched.startDate,
                    endDate: matched.endDate,
                    dailyPlan: [],
                    databaseId,
                };
            }
            groupedBySubject[subjectKey].dailyPlan.push(`${item.date}: ${item.content}`);
        }
        return Object.values(groupedBySubject);
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
        const { chapterTitle, contentVolume } = chapter;
        const pagesPerSlice = 10;
        const slices = [];
        let pageStart = 1;
        while (pageStart <= contentVolume) {
            const pageEnd = Math.min(pageStart + pagesPerSlice - 1, contentVolume);
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
    getAllStudyDates(subjects, studyDays) {
        const dayMap = {
            Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
            Thursday: 4, Friday: 5, Saturday: 6,
        };
        const allowed = studyDays.map(d => dayMap[d]);
        const allDates = new Set();
        for (const subj of subjects) {
            const interval = (0, date_fns_1.eachDayOfInterval)({
                start: (0, date_fns_1.parseISO)(subj.startDate),
                end: (0, date_fns_1.parseISO)(subj.endDate),
            });
            for (const d of interval) {
                if (allowed.includes(d.getDay())) {
                    allDates.add((0, date_fns_1.format)(d, 'M/d'));
                }
            }
        }
        return Array.from(allDates).sort();
    }
    createPromptWithConstraints(slices, allowedDates, pref, style) {
        const lines = [];
        lines.push(`너는 AI 학습 계획 생성기야.`);
        lines.push(`다음 챕터 목록을 가능한 날짜에 맞춰 적절히 분배해.`);
        lines.push(`조건은 다음과 같아:`);
        lines.push(`- 하루 최대 ${pref.sessionsPerDay || 2}개의 챕터까지만 배정 가능`);
        lines.push(`- 가능한 날짜: ${allowedDates.join(', ')}`);
        if (style === 'focus') {
            lines.push(`- 하루에는 반드시 하나의 과목만 포함되도록 구성해줘`);
        }
        lines.push(`- 출력은 반드시 JSON 배열 형식, 항목은 subject, date, content만 포함해야 해`);
        lines.push(`- 설명이나 print문, 코드블럭 포함하지 마`);
        lines.push(`\n챕터 목록:`);
        slices.forEach((s, i) => {
            lines.push(`${i + 1}. ${s.subject} - ${s.title} ${s.pageRange}`);
        });
        return lines.join('\n');
    }
};
exports.AiPlannerService = AiPlannerService;
exports.AiPlannerService = AiPlannerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        user_preference_service_1.UserPreferenceService,
        exam_service_1.ExamService,
        notion_service_1.NotionService,
        llm_client_service_1.LlmClientService])
], AiPlannerService);
//# sourceMappingURL=ai-planner.service.js.map
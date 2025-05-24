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
const date_utils_1 = require("./utils/date-utils");
let AiPlannerService = class AiPlannerService {
    configService;
    userPreferenceService;
    examService;
    notionService;
    constructor(configService, userPreferenceService, examService, notionService) {
        this.configService = configService;
        this.userPreferenceService = userPreferenceService;
        this.examService = examService;
        this.notionService = notionService;
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
        const estimates = this.estimateDaysByDifficulty(mergedSubjects);
        const studyDates = (0, date_utils_1.getAllStudyDates)(mergedSubjects, preference.studyDays);
        const rawPlans = this.assignChaptersFallback(estimates, studyDates, preference.sessionsPerDay, style);
        const results = this.groupDailyPlansBySubject(userId, databaseId, mergedSubjects, rawPlans);
        for (const result of results) {
            await this.notionService.syncToNotion(result);
        }
        return results;
    }
    estimateDaysByDifficulty(subjects) {
        const diffWeight = { '상': 1.5, '중': 1.0, '하': 0.7 };
        const result = [];
        for (const subject of subjects) {
            for (const chapter of subject.chapters) {
                const factor = diffWeight[chapter.difficulty] || 1.0;
                const days = Math.ceil((chapter.contentVolume * factor) / 10);
                result.push({
                    subject: subject.subject,
                    title: chapter.chapterTitle,
                    contentVolume: chapter.contentVolume,
                    estimatedDays: days,
                });
            }
        }
        return result;
    }
    assignChaptersFallback(chapters, dates, maxPerDay, style) {
        const result = [];
        let dateIndex = 0;
        let sessionInDay = 0;
        if (style === 'focus') {
            const grouped = chapters.reduce((acc, c) => {
                if (!acc[c.subject])
                    acc[c.subject] = [];
                acc[c.subject].push(c);
                return acc;
            }, {});
            for (const subject of Object.keys(grouped)) {
                const subjectChapters = grouped[subject];
                for (const chapter of subjectChapters) {
                    let remaining = chapter.contentVolume;
                    const pagesPerDay = Math.ceil(chapter.contentVolume / chapter.estimatedDays);
                    let pageStart = 1;
                    while (remaining > 0 && dateIndex < dates.length) {
                        const pageEnd = Math.min(pageStart + pagesPerDay - 1, chapter.contentVolume);
                        result.push({
                            subject: chapter.subject,
                            date: dates[dateIndex],
                            content: `${chapter.title} (p.${pageStart}-${pageEnd})`,
                        });
                        const pagesThisSession = pageEnd - pageStart + 1;
                        remaining -= pagesThisSession;
                        pageStart = pageEnd + 1;
                        dateIndex++;
                    }
                }
            }
        }
        else {
            for (const chapter of chapters) {
                let remaining = chapter.contentVolume;
                const pagesPerDay = Math.ceil(chapter.contentVolume / chapter.estimatedDays);
                let pageStart = 1;
                while (remaining > 0) {
                    const pageEnd = Math.min(pageStart + pagesPerDay - 1, chapter.contentVolume);
                    const date = dates[dateIndex];
                    result.push({
                        subject: chapter.subject,
                        date,
                        content: `${chapter.title} (p.${pageStart}-${pageEnd})`,
                    });
                    const pagesThisSession = pageEnd - pageStart + 1;
                    remaining -= pagesThisSession;
                    pageStart = pageEnd + 1;
                    sessionInDay++;
                    if (sessionInDay >= maxPerDay) {
                        dateIndex++;
                        sessionInDay = 0;
                    }
                    if (dateIndex >= dates.length) {
                        console.warn('⚠️ 날짜 부족');
                        return result;
                    }
                }
            }
        }
        return result;
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
                    importance: exam.importance,
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
    groupDailyPlansBySubject(userId, databaseId, subjects, rawPlans) {
        const groupedBySubject = {};
        for (const item of rawPlans) {
            const subjectKey = item.subject;
            if (!groupedBySubject[subjectKey]) {
                const matched = subjects.find(s => s.subject === subjectKey);
                if (!matched)
                    throw new Error(`❌ 과목 일치 실패: ${subjectKey}`);
                groupedBySubject[subjectKey] = {
                    userId,
                    subject: subjectKey,
                    startDate: matched.startDate.toString(),
                    endDate: matched.endDate.toString(),
                    dailyPlan: [],
                    databaseId,
                };
            }
            groupedBySubject[subjectKey].dailyPlan.push(`${item.date}: ${item.content}`);
        }
        return Object.values(groupedBySubject);
    }
};
exports.AiPlannerService = AiPlannerService;
exports.AiPlannerService = AiPlannerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        user_preference_service_1.UserPreferenceService,
        exam_service_1.ExamService,
        notion_service_1.NotionService])
], AiPlannerService);
//# sourceMappingURL=ai-planner.service.js.map
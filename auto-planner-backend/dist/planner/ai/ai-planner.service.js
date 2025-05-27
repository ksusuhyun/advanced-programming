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
const date_fns_1 = require("date-fns");
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
    async generateStudyPlan(userId) {
        const preference = await this.userPreferenceService.findByUserId(userId);
        const { exams } = await this.examService.findByUser(userId);
        const databaseId = this.configService.get('DATABASE_ID');
        if (!preference || !exams || !databaseId) {
            throw new common_1.InternalServerErrorException('❌ 아직 필요한 데이터 남아있음');
        }
        const mergedSubjects = this.mergeSubjects(exams);
        const estimates = this.estimateDaysByDifficulty(mergedSubjects);
        const subjectDateMap = this.getStudyDatesBySubject(mergedSubjects, preference.studyDays);
        const rawPlans = this.assignChaptersSmart(estimates, mergedSubjects, subjectDateMap, preference.sessionsPerDay, preference.style);
        const results = this.groupDailyPlansBySubject(userId, databaseId, mergedSubjects, rawPlans);
        for (const result of results) {
            const end = new Date(result.endDate);
            const review1 = (0, date_fns_1.format)((0, date_fns_1.subDays)(end, 2), 'yyyy-MM-dd');
            const review2 = (0, date_fns_1.format)((0, date_fns_1.subDays)(end, 1), 'yyyy-MM-dd');
            const formattedEndDate = (0, date_fns_1.format)(end, 'yyyy-MM-dd');
            result.dailyPlan.push(`${review1}: 복습: 전체 챕터 복습`);
            result.dailyPlan.push(`${review2}: 복습: 전체 챕터 복습`);
            result.dailyPlan.push(`${formattedEndDate}: 📝 시험일: ${result.subject}`);
            await this.notionService.syncToNotion(result);
        }
        return this.mapResponseForClient(results);
    }
    getStudyDatesBySubject(subjects, studyDays) {
        const dayMap = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };
        const allowedDays = studyDays.map(day => dayMap[day]);
        const subjectDateMap = {};
        for (const subj of subjects) {
            const interval = (0, date_fns_1.eachDayOfInterval)({
                start: new Date(subj.startDate),
                end: new Date(subj.endDate),
            });
            const validDates = interval
                .filter(d => allowedDays.includes(d.getDay()))
                .map(d => (0, date_fns_1.format)(d, 'yyyy-MM-dd'));
            subjectDateMap[subj.subject] = validDates;
        }
        return subjectDateMap;
    }
    estimateDaysByDifficulty(subjects) {
        const diffWeight = { 1: 0.7, 2: 0.85, 3: 1.0, 4: 1.4, 5: 1.8 };
        const result = [];
        for (const subject of subjects) {
            for (const chapter of subject.chapters) {
                const weight = chapter.contentVolume * (diffWeight[chapter.difficulty] || 1.0);
                const days = Math.ceil(weight / 10);
                result.push({
                    subject: subject.subject,
                    title: chapter.chapterTitle,
                    contentVolume: chapter.contentVolume,
                    estimatedDays: days,
                    difficulty: chapter.difficulty,
                    weight,
                });
            }
        }
        return result;
    }
    assignChaptersSmart(chapters, subjects, subjectDateMap, sessionsPerDay, style) {
        const plans = [];
        if (style === 'focus') {
            for (const subject of subjects) {
                const dates = subjectDateMap[subject.subject];
                const endDate = dates[dates.length - 1];
                const reservedDates = new Set([
                    (0, date_fns_1.format)((0, date_fns_1.subDays)(new Date(endDate), 1), 'yyyy-MM-dd'),
                    (0, date_fns_1.format)((0, date_fns_1.subDays)(new Date(endDate), 2), 'yyyy-MM-dd'),
                    endDate,
                ]);
                const availableDates = dates.filter(d => !reservedDates.has(d));
                const subjectChapters = chapters.filter(c => c.subject === subject.subject);
                const totalWeight = subjectChapters.reduce((sum, ch) => sum + ch.weight, 0);
                const daySlices = {};
                for (const ch of subjectChapters) {
                    const ratio = ch.weight / totalWeight;
                    daySlices[ch.title] = Math.max(1, Math.round(ratio * availableDates.length));
                }
                let dateIdx = 0;
                for (const ch of subjectChapters) {
                    const sliceDays = daySlices[ch.title];
                    const pagesPerDay = Math.ceil(ch.contentVolume / sliceDays);
                    let pageStart = 1;
                    for (let i = 0; i < sliceDays; i++) {
                        if (dateIdx >= availableDates.length)
                            break;
                        const date = availableDates[dateIdx++];
                        const pageEnd = Math.min(ch.contentVolume, pageStart + pagesPerDay - 1);
                        plans.push({ subject: subject.subject, date, content: `${ch.title} (p.${pageStart}-${pageEnd})` });
                        pageStart = pageEnd + 1;
                    }
                }
            }
        }
        else {
            const calendar = {};
            for (const subject of subjects) {
                const dates = subjectDateMap[subject.subject];
                const endDate = dates[dates.length - 1];
                const reservedDates = new Set([
                    (0, date_fns_1.format)((0, date_fns_1.subDays)(new Date(endDate), 1), 'yyyy-MM-dd'),
                    (0, date_fns_1.format)((0, date_fns_1.subDays)(new Date(endDate), 2), 'yyyy-MM-dd'),
                    endDate,
                ]);
                const availableDates = dates.filter(d => !reservedDates.has(d));
                const subjectChapters = chapters.filter(c => c.subject === subject.subject);
                const totalWeight = subjectChapters.reduce((sum, ch) => sum + ch.weight, 0);
                const daySlices = {};
                for (const ch of subjectChapters) {
                    const ratio = ch.weight / totalWeight;
                    daySlices[ch.title] = Math.max(1, Math.round(ratio * availableDates.length));
                }
                let dateIdx = 0;
                for (const ch of subjectChapters) {
                    const sliceDays = daySlices[ch.title];
                    const pagesPerDay = Math.ceil(ch.contentVolume / sliceDays);
                    let pageStart = 1;
                    for (let i = 0; i < sliceDays; i++) {
                        if (dateIdx >= availableDates.length)
                            break;
                        const date = availableDates[dateIdx++];
                        const pageEnd = Math.min(ch.contentVolume, pageStart + pagesPerDay - 1);
                        if (!calendar[date])
                            calendar[date] = [];
                        calendar[date].push({ subject: subject.subject, content: `${ch.title} (p.${pageStart}-${pageEnd})` });
                        pageStart = pageEnd + 1;
                    }
                }
            }
            for (const [date, items] of Object.entries(calendar)) {
                for (const item of items)
                    plans.push({ ...item, date });
            }
        }
        plans.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return plans;
    }
    mapResponseForClient(results) {
        return results.map(({ subject, startDate, endDate, dailyPlan, userId, databaseId }) => ({
            subject,
            startDate,
            endDate,
            dailyPlan,
            userId,
            databaseId,
        }));
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
                    startDate: (0, date_fns_1.format)(new Date(matched.startDate), 'yyyy-MM-dd'),
                    endDate: (0, date_fns_1.format)(new Date(matched.endDate), 'yyyy-MM-dd'),
                    dailyPlan: [],
                    databaseId,
                };
            }
            const dailyPlan = groupedBySubject[subjectKey].dailyPlan;
            const date = item.date;
            const fullContent = item.content;
            dailyPlan.push(`${date}: ${fullContent}`);
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
                    importance: exam.importance,
                    chapters: [...exam.chapters],
                };
            }
            else {
                grouped[key].startDate = new Date(exam.startDate) < new Date(grouped[key].startDate)
                    ? exam.startDate : grouped[key].startDate;
                grouped[key].endDate = new Date(exam.endDate) > new Date(grouped[key].endDate)
                    ? exam.endDate : grouped[key].endDate;
                grouped[key].chapters.push(...exam.chapters);
            }
        }
        return Object.values(grouped);
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
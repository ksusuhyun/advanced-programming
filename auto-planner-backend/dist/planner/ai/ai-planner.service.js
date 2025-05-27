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
    mergePageRanges(ranges) {
        const sorted = ranges.sort((a, b) => a[0] - b[0]);
        const merged = [];
        for (const [start, end] of sorted) {
            if (merged.length === 0 || merged[merged.length - 1][1] < start - 1) {
                merged.push([start, end]);
            }
            else {
                merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], end);
            }
        }
        return merged;
    }
    estimateDaysByDifficulty(subjects) {
        const diffWeight = {
            '쉬움': 0.7,
            '보통': 1.0,
            '어려움': 1.5,
        };
        const result = [];
        for (const subject of subjects) {
            for (const chapter of subject.chapters) {
                const baseWeight = chapter.contentVolume * (diffWeight[chapter.difficulty] || 1.0);
                const importanceFactor = 1 + subject.importance * 0.05;
                const weight = baseWeight * importanceFactor;
                result.push({
                    subject: subject.subject,
                    title: chapter.chapterTitle,
                    contentVolume: chapter.contentVolume,
                    estimatedDays: 0,
                    difficulty: chapter.difficulty,
                    weight,
                });
            }
        }
        return result;
    }
    assignChaptersSmart(chapters, subjects, subjectDateMap, sessionsPerDay, style) {
        const plans = [];
        const calendar = {};
        const sessionPlan = {};
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
            const totalSessions = availableDates.length * sessionsPerDay;
            let dateIdx = 0;
            for (const ch of subjectChapters) {
                let remaining = ch.contentVolume;
                let currentPage = 1;
                while (remaining > 0 && dateIdx < availableDates.length) {
                    const date = availableDates[dateIdx];
                    if (style === 'focus' && calendar[date] && calendar[date] !== subject.subject) {
                        dateIdx++;
                        continue;
                    }
                    const usedSessions = sessionPlan[date] || 0;
                    if (usedSessions >= sessionsPerDay) {
                        dateIdx++;
                        continue;
                    }
                    const sessionSize = Math.min(remaining, Math.ceil(ch.weight / totalWeight * totalSessions));
                    const pageEnd = Math.min(currentPage + sessionSize - 1, ch.contentVolume);
                    plans.push({
                        subject: subject.subject,
                        date,
                        content: `${ch.title} (p.${currentPage}-${pageEnd})`,
                    });
                    calendar[date] = subject.subject;
                    sessionPlan[date] = usedSessions + 1;
                    const consumed = pageEnd - currentPage + 1;
                    remaining -= consumed;
                    currentPage = pageEnd + 1;
                }
            }
            const assignedDates = new Set(plans.filter(p => p.subject === subject.subject).map(p => p.date));
            const remainingDates = availableDates.filter(d => !assignedDates.has(d));
            const sortedChapters = [...subjectChapters].sort((a, b) => this.difficultyRank(b.difficulty) - this.difficultyRank(a.difficulty));
            let ri = 0;
            for (const date of remainingDates) {
                const ch = sortedChapters[ri % sortedChapters.length];
                plans.push({ subject: subject.subject, date, content: `복습: ${ch.title}` });
                ri++;
            }
        }
        plans.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return plans;
    }
    difficultyRank(diff) {
        return { '쉬움': 1, '보통': 2, '어려움': 3 }[diff] || 2;
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
        const pageMap = {};
        for (const item of rawPlans) {
            const subjectKey = item.subject;
            const date = item.date;
            const match = item.content.match(/^(.*) \(p\.(\d+)-(\d+)\)$/);
            if (!match)
                continue;
            const [_, chapterTitle, start, end] = match;
            const pStart = parseInt(start, 10);
            const pEnd = parseInt(end, 10);
            pageMap[subjectKey] ??= {};
            pageMap[subjectKey][date] ??= {};
            pageMap[subjectKey][date][chapterTitle] ??= [];
            pageMap[subjectKey][date][chapterTitle].push([pStart, pEnd]);
        }
        for (const subjectKey of Object.keys(pageMap)) {
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
            const dateMap = pageMap[subjectKey];
            for (const date of Object.keys(dateMap).sort()) {
                const chapterContents = [];
                for (const chapterTitle of Object.keys(dateMap[date])) {
                    const ranges = dateMap[date][chapterTitle];
                    const merged = this.mergePageRanges(ranges);
                    for (const [s, e] of merged) {
                        chapterContents.push(`${chapterTitle} (p.${s}-${e})`);
                    }
                }
                if (chapterContents.length > 0) {
                    groupedBySubject[subjectKey].dailyPlan.push(`${date}: ${chapterContents.join(', ')}`);
                }
            }
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
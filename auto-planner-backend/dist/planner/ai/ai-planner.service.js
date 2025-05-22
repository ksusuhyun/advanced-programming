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
let AiPlannerService = class AiPlannerService {
    configService;
    userPreferenceService;
    examService;
    llmClient;
    constructor(configService, userPreferenceService, examService, llmClient) {
        this.configService = configService;
        this.userPreferenceService = userPreferenceService;
        this.examService = examService;
        this.llmClient = llmClient;
    }
    async generateStudyPlanByUserId(userId) {
        const preference = await this.userPreferenceService.findByUserId(userId);
        const { exams } = await this.examService.findByUser(userId);
        console.log('✅ preference:', preference);
        console.log('✅ exams:', exams);
        if (!preference || !exams || exams.length === 0) {
            throw new common_1.InternalServerErrorException('❌ 유저 정보 또는 시험 데이터가 부족합니다.');
        }
        const mergedSubjects = this.mergeSubjects(exams);
        const prompt = this.createPrompt(mergedSubjects, preference);
        const raw = await this.llmClient.generate(prompt);
        if (!Array.isArray(raw)) {
            console.error('❌ LLM 응답이 배열이 아님:', raw);
            throw new common_1.InternalServerErrorException('LLM 응답이 JSON 배열 형식이 아닙니다.');
        }
        return raw;
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
    createPrompt(subjects, pref) {
        const lines = [
            "You are an assistant that returns ONLY a valid JSON array, no explanations.",
            "Each array item must have: subject, startDate, endDate, and dailyPlan.",
            "Each dailyPlan entry MUST include a page range (e.g., (p.23-34)).",
            "Do NOT include any text before or after the JSON array.",
            "",
            "User Preferences:",
            `- Style: ${pref.style === 'focus' ? 'Focused' : 'Multi'}`,
            `- Study Days: ${pref.studyDays.join(', ')}`,
            `- Sessions per Day: ${pref.sessionsPerDay}`,
            "",
            "Exams:",
        ];
        for (const subj of subjects) {
            const chapters = subj.chapters
                .map((ch, i) => `Chapter ${i + 1}: ${ch.chapterTitle}`)
                .join(', ');
            lines.push(`- Subject: ${subj.subject}`, `  Period: ${new Date(subj.startDate).toDateString()} ~ ${new Date(subj.endDate).toDateString()}`, `  Chapters: ${chapters}`, "");
        }
        return lines.join('\n');
    }
};
exports.AiPlannerService = AiPlannerService;
exports.AiPlannerService = AiPlannerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        user_preference_service_1.UserPreferenceService,
        exam_service_1.ExamService,
        llm_client_service_1.LLMClientService])
], AiPlannerService);
//# sourceMappingURL=ai-planner.service.js.map
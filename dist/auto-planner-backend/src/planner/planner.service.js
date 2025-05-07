"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlannerService = void 0;
const common_1 = require("@nestjs/common");
let PlannerService = class PlannerService {
    generatePlan(dto) {
        const prompt = this._generatePrompt(dto);
        return {
            message: '계획 생성 성공',
            promptSentToAPI: prompt,
            generatedPlan: `시험 과목: ${dto.subject}, 기간: ${dto.startDate} ~ ${dto.endDate}, 챕터 수: ${dto.chapters.length}`,
        };
    }
    _generatePrompt(dto) {
        return `
      사용자는 ${dto.studyPreference} 성향입니다.
      과목: ${dto.subject}
      시험 기간: ${dto.startDate} ~ ${dto.endDate}
      중요도: ${dto.importance}
      학습 챕터 수: ${dto.chapters.length}
    `;
    }
    confirmPlan(dto) {
        return {
            message: '공부 계획이 확정되었습니다. Notion 전송 준비 완료',
            dataForNotion: dto,
        };
    }
};
exports.PlannerService = PlannerService;
exports.PlannerService = PlannerService = __decorate([
    (0, common_1.Injectable)()
], PlannerService);
//# sourceMappingURL=planner.service.js.map
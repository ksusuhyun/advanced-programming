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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiPlannerController = void 0;
const common_1 = require("@nestjs/common");
const ai_planner_service_1 = require("./ai-planner.service");
const swagger_1 = require("@nestjs/swagger");
let AiPlannerController = class AiPlannerController {
    aiPlannerService;
    constructor(aiPlannerService) {
        this.aiPlannerService = aiPlannerService;
    }
    async generatePlan(body) {
        return this.aiPlannerService.generateStudyPlan(body.userId);
    }
};
exports.AiPlannerController = AiPlannerController;
__decorate([
    (0, common_1.Post)('/generate'),
    (0, swagger_1.ApiOperation)({
        summary: '학습 계획 생성 (LLM 제외)',
        description: '유저 ID 기반으로 내부 rule engine을 사용하여 학습 계획을 생성하고 Notion에 동기화합니다.',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['userId'],
            properties: {
                userId: {
                    type: 'string',
                    example: '202255150',
                },
            },
        },
    }),
    (0, swagger_1.ApiOkResponse)({
        description: '성공적으로 생성된 학습 계획',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    subject: { type: 'string', example: '시계열분석' },
                    startDate: { type: 'string', example: '2025-05-23' },
                    endDate: { type: 'string', example: '2025-06-11' },
                    userId: { type: 'string', example: '202255150' },
                    databaseId: { type: 'string', example: 'notion-db-id' },
                    dailyPlan: {
                        type: 'array',
                        items: { type: 'string', example: '6/1: Chapter 1 (p.1-10)' },
                    },
                },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiPlannerController.prototype, "generatePlan", null);
exports.AiPlannerController = AiPlannerController = __decorate([
    (0, swagger_1.ApiTags)('ai-plan'),
    (0, common_1.Controller)('ai-plan'),
    __metadata("design:paramtypes", [ai_planner_service_1.AiPlannerService])
], AiPlannerController);
//# sourceMappingURL=ai-planner.controller.js.map
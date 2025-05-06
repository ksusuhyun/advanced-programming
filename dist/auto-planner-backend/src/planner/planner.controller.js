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
exports.PlannerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const generate_plan_dto_1 = require("./dto/generate-plan.dto");
const planner_service_1 = require("./planner.service");
const confirm_plan_dto_1 = require("./dto/confirm-plan.dto");
let PlannerController = class PlannerController {
    constructor(plannerService) {
        this.plannerService = plannerService;
    }
    generatePlan(dto) {
        return this.plannerService.generatePlan(dto);
    }
    confirmPlan(dto) {
        return this.plannerService.confirmPlan(dto);
    }
};
exports.PlannerController = PlannerController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, swagger_1.ApiOperation)({ summary: '공부 계획 생성 요청' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_plan_dto_1.GeneratePlanDto]),
    __metadata("design:returntype", void 0)
], PlannerController.prototype, "generatePlan", null);
__decorate([
    (0, common_1.Post)('confirm'),
    (0, swagger_1.ApiOperation)({ summary: '공부 계획 확정 및 Notion 전송' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [confirm_plan_dto_1.ConfirmPlanDto]),
    __metadata("design:returntype", void 0)
], PlannerController.prototype, "confirmPlan", null);
exports.PlannerController = PlannerController = __decorate([
    (0, swagger_1.ApiTags)('planner'),
    (0, common_1.Controller)('planner'),
    __metadata("design:paramtypes", [planner_service_1.PlannerService])
], PlannerController);
//# sourceMappingURL=planner.controller.js.map
import { Injectable } from '@nestjs/common';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { ConfirmPlanDto } from './dto/confirm-plan.dto';

@Injectable()
export class PlannerService {
  generatePlan(dto: GeneratePlanDto) {
    // 실제 Chatbot API 호출은 생략하고, 가짜 계획 반환
    const prompt = this._generatePrompt(dto);

    return {
      message: '계획 생성 성공',
      promptSentToAPI: prompt,
      generatedPlan: `시험 과목: ${dto.subject}, 기간: ${dto.startDate} ~ ${dto.endDate}, 챕터 수: ${dto.chapters.length}`,
    };
  }

  private _generatePrompt(dto: GeneratePlanDto): string {
    return `
      사용자는 ${dto.studyPreference} 성향입니다.
      과목: ${dto.subject}
      시험 기간: ${dto.startDate} ~ ${dto.endDate}
      중요도: ${dto.importance}
      학습 챕터 수: ${dto.chapters.length}
    `;
  }

  confirmPlan(dto: ConfirmPlanDto) {
    // 실제 Notion API 호출은 아직 구현하지 않음
    return {
      message: '공부 계획이 확정되었습니다. Notion 전송 준비 완료',
      dataForNotion: dto,
    };
  }
}

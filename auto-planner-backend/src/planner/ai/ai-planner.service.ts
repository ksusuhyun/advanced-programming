import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AiGeneratePlanDto } from './dto/generate-plan.dto';
import axios from 'axios';
import { ConfigService } from '@nestjs/config'; // 환경변수 관리 모듈 추가

@Injectable()
// AiPlannerService : NestJS의 @Injectable() 데코레이터 통해 의존성 주입 가능한 서비스로 등록
export class AiPlannerService {
  constructor(private readonly configService: ConfigService) {}

  // generateStudyPlan : 사용자가 보낸 dto를 바탕으로 프롬프트 생성
  async generateStudyPlan(dto: AiGeneratePlanDto): Promise<any> {
    const prompt = this.createPrompt(dto);

    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const model =
      this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo'; // 기본 모델 설정
    try {
      // OpenAI ChatGPT API 호출
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo', // 필요에 따라 gpt-3.5-turbo로도 변경 가능
          messages: [
            { role: 'system', content: 'You are a helpful study planner.' },
            { role: 'user', content: prompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const content = (response.data as any).choices[0].message.content;
      console.log('[GPT 응답]', content);
      return JSON.parse(content);
    } catch (error) {
      console.error(
        '[🔥 GPT 호출 오류]',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('AI 응답 처리 중 오류 발생');
    }
  }

  // createPrompt : GeneratePlanDto를 바탕으로 프롬프트 생성하는 메서드
  private createPrompt(dto: AiGeneratePlanDto): string {
    const chapters = dto.chapters
      .map(
        (ch, i) =>
          `Chapter ${i + 1}: "${ch.chapterTitle}", Difficulty: ${ch.difficulty}, Volume: ${ch.contentVolume}`,
      )
      .join('\n');

    return `
Generate a study plan in JSON format.

Subject: ${dto.subject}
Study period: ${dto.startDate} to ${dto.endDate}
Importance: ${dto.importance}/5
Chapters:
${chapters}

Please return a day-by-day plan in JSON. Do not include explanation.
`;
  }
}

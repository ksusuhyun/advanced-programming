import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserPreferenceService } from '../../user-preference/user-preference.service';
import { ExamService } from '../../exam/exam.service';
import { getToken } from 'src/auth/notion-token.store';
import axios from 'axios';

@Injectable()
export class AiPlannerService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userPreferenceService: UserPreferenceService,
    private readonly examService: ExamService,
  ) {}

  async generateStudyPlan(userId: string, databaseIdOverride?: string): Promise<any[]> {
    const token = getToken(userId);
    if (!token) {
      throw new InternalServerErrorException(`❌ Notion 토큰 없음: userId=${userId}`);
    }

    const userWithPref = await this.userPreferenceService.findByUserId(userId);
    const userWithExams = await this.examService.findByUser(userId);

    const preference = userWithPref;
    const exams = userWithExams?.exams;

    if (!preference || !exams || exams.length === 0) {
      throw new InternalServerErrorException('❌ 사용자 설정 또는 시험 정보 없음');
    }

    const databaseId = databaseIdOverride || this.configService.get<string>('DATABASE_ID') || 'notion-db-id';
    const prompt = this.buildPrompt(exams, preference);
    const llmDailyPlans = await this.callLlamaAPI(prompt);

    const result = exams.map((exam, idx) => ({
      userId,
      subject: exam.subject,
      startDate: exam.startDate.toISOString().split('T')[0],
      endDate: exam.endDate.toISOString().split('T')[0],
      databaseId,
      dailyPlan: llmDailyPlans[idx]?.dailyPlan || [],
    }));

    return result;
  }

  private buildPrompt(exams: any[], preference: any): string {
    return `
너는 AI 학습 플래너야. 아래 정보를 바탕으로 각 과목별 학습 일정을 JSON 형식으로 작성해줘. 각 과목은 다음 형식을 따라야 해:

출력 예시:
[
  { "dailyPlan": ["6/1: Chapter 1 (p.1-10)", "6/2: Chapter 2 (p.11-20)"] },
  { "dailyPlan": ["6/1: Chapter A (p.1-5)", "6/2: Chapter B (p.6-10)"] },
  ...
]

제약 조건:
- exam.importance가 높을수록 학습 우선순위를 높여줘. (즉, Notion 캘린더 상위에 위치할 과목으로 간주)
- chapter.difficulty가 높을수록 하루에 적은 분량(페이지 수)을 할당해줘 (어려운 챕터는 나눠서 진행)
- preference.style이 "multi"이면 하루에 여러 과목을 섞어서 공부할 수 있어
- preference.style이 "focus"이면 하루에 한 과목만 집중해서 공부해야 해
- preference.sessionsPerDay는 하루 최대 공부 세션 수를 의미해 (multi일 때 하루 최대 과목 수)
- preference.studyDays는 사용자가 공부 가능한 요일이야 (예: ["월", "화", "수", "목", "금"])

시험 정보: ${JSON.stringify(exams, null, 2)}
사용자 선호도: ${JSON.stringify(preference, null, 2)}
    `.trim();
  }

  private async callLlamaAPI(prompt: string): Promise<any[]> {
    const response = await axios.post(
      'http://10.125.208.217:9241/v1/completions',
      {
        model: 'llama-70b',
        prompt,
        temperature: 0.7,
        max_tokens: 2048
      },
      {
        headers: {
          'Authorization': `Bearer dummy-api-key`,
          'Content-Type': 'application/json'
        }
      }
    );

    const text = response.data.choices?.[0]?.text || '';
    const jsonMatch = text.match(/\[.*\]/s);

    if (!jsonMatch) {
      throw new Error('❌ JSON 응답 파싱 실패');
    }

    return JSON.parse(jsonMatch[0]);
  }
}

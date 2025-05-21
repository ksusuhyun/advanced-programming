import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserPreferenceService } from '../../user-preference/user-preference.service';
import { ExamService } from '../../exam/exam.service';
import { NotionService } from '../../notion/notion.service';
import axios from 'axios';

@Injectable()
export class AiPlannerService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userPreferenceService: UserPreferenceService,
    private readonly examService: ExamService,
    private readonly notionService: NotionService,
  ) {}

  async generateStudyPlanByUserId(userId: string): Promise<any> {
    const preference = await this.userPreferenceService.findByUserId(userId);
    const exam = await this.examService.findLatestByUserId(userId);

    if (!preference || !exam)
      throw new InternalServerErrorException('필수 정보가 없습니다');

    const prompt = this.createPrompt(exam, preference);

    const hfApiKey = this.configService.get<string>('HF_API_KEY');
    const hfModel = this.configService.get<string>('HF_MODEL');

    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${hfModel}`,
        { inputs: prompt }, // 👈 여기에 prompt 반영
        {
          headers: {
            Authorization: `Bearer ${hfApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      // 유연하게 파싱
      const rawText = response.data?.[0]?.generated_text || response.data;
      console.log('📋 AI 원시 응답:', rawText); // ✅ 여기에 추가
      interface AiDayPlan {
      day: number;
      chapters: string[];
    }
      let parsed: AiDayPlan[];


      try {
        parsed = typeof rawText === 'string' ? JSON.parse(rawText) : rawText;
        console.log('🧩 파싱된 JSON:', parsed); // ✅ 
      } catch (e) {
        console.error('❌ JSON 파싱 실패:', rawText);
        throw new InternalServerErrorException('❌ AI 응답이 JSON 형식이 아닙니다');
      }

      const optimized = this.optimizeResponse(parsed, exam.startDate.toISOString());

      const notionFormatted = this.convertToNotionFormat(
        exam.subject,
        exam.startDate.toISOString(),
        exam.endDate.toISOString(),
        optimized,
      );
      console.log('🗓️ Notion 업로드용 포맷:', notionFormatted); // ✅ 여기

      await this.notionService.syncToNotion({
        subject: exam.subject,
        startDate: exam.startDate.toISOString(),
        endDate: exam.endDate.toISOString(),
        databaseId: this.configService.get<string>('DATABASE_ID')!,
        dailyPlan: notionFormatted, // 최종 포맷 정렬
      });

      return {
        message: '✅ 학습 계획이 생성되어 Notion에 저장되었습니다.',
        notionPreview: notionFormatted,
      };
    } catch (err) {
      console.error('[AI 오류]', err);
      throw new InternalServerErrorException('AI 응답 처리 실패');
    }
  }

  private createPrompt(dto: any, pref: any): string {
    const chapters = dto.chapters
      .map(
        (ch, i) =>
          `Chapter ${i + 1}: "${ch.chapterTitle}", 난이도: ${ch.difficulty}, 분량: ${ch.contentVolume}`,
      )
      .join('\n');

    // 🔧 flan-t5처럼 약한 모델에도 명확히 JSON만 출력하도록 요청
    return [
      '당신은 학습 계획을 세우는 인공지능입니다.',
      '아래 정보를 기반으로 하루 단위 학습 일정을 **정확한 JSON 배열**로 만들어 주세요.',
      '설명 없이 JSON만 출력하세요. 백틱(`)은 쓰지 마세요.',
      '⚠️ summary_text 같은 설명은 포함하지 마세요.',
      '',
      '[사용자 정보]',
      `- 학습 스타일: ${pref.style === 'focus' ? '하루 한 과목 집중' : '여러 과목 병행'}`,
      `- 학습 요일: ${pref.studyDays.join(', ')}`,
      `- 하루 학습 세션 수: ${pref.sessionsPerDay}`,
      `- 기상 유형: ${pref.wakeTime === 'morning' ? '오전형(9시 시작)' : '야행성(18시 시작)'}`,
      '',
      '[시험 정보]',
      `- 과목: ${dto.subject}`,
      `- 학습 기간: ${dto.startDate} ~ ${dto.endDate}`,
      `- 중요도: ${dto.importance}/5`,
      '- 챕터 목록:',
      chapters,
      '',
      '규칙:',
      '1. 모든 챕터를 남은 일수에 균등하게 분배하세요.',
      '2. 하루 단위로 "day"를 지정하고, 해당 날짜의 "chapters"를 배열로 제공하세요.',
      '3. 복습 또는 휴식일도 포함되면 좋습니다.',
      '',
      '예시 출력:',
      '[{ "day": 1, "chapters": ["Chapter 1", "Chapter 2"] }, { "day": 2, "chapters": ["Chapter 3"] }]',
    ].join('\n');
  }

  private optimizeResponse(parsed: any[], startDate: string): any[] {
    const { format, addDays } = require('date-fns');

    return parsed.map((item, index) => {
      const currentDate = addDays(new Date(startDate), index);
      return {
        date: format(currentDate, 'yyyy-MM-dd'),
        day: item.day || index + 1,
        tasks: item.chapters || [],
      };
    });
  }

  private convertToNotionFormat(
    subject: string,
    startDate: string,
    endDate: string,
    optimized: { date: string; day: number; tasks: string[] }[]
  ): string[] {
    const { format, parseISO } = require('date-fns');

    return optimized.map((item) => {
      const dateObj = parseISO(item.date);
      const monthDay = format(dateObj, 'M/d');
      const taskText = item.tasks.join(', ');
      return `${monthDay}: ${taskText}`; // 백틱 탬플릿 리터럴 오류 수정
    });
  }
}

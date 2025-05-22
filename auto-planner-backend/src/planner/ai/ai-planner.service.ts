import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserPreferenceService } from '../../user-preference/user-preference.service';
import { ExamService } from '../../exam/exam.service';
import { LLMClientService } from './llm-client.service';
import { SyncToNotionDto } from '../../notion/dto/sync-to-notion.dto';
interface Preference {
  style: string;
  studyDays: string[];
  sessionsPerDay: number;
}

interface Chapter {
  chapterTitle: string;
  contentVolume?: number; // optional, 필요하면 추가
}

interface Subject {
  subject: string;
  startDate: string;
  endDate: string;
  chapters: Chapter[];
}


@Injectable()
export class AiPlannerService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userPreferenceService: UserPreferenceService,
    private readonly examService: ExamService,
    private readonly llmClient: LLMClientService,
  ) {}

  async generateStudyPlanByUserId(userId: string): Promise<SyncToNotionDto[]> {
    const preference = await this.userPreferenceService.findByUserId(userId);
    const { exams } = await this.examService.findByUser(userId);
    console.log('✅ preference:', preference);
    console.log('✅ exams:', exams);

    if (!preference || !exams || exams.length === 0) {
      throw new InternalServerErrorException('❌ 유저 정보 또는 시험 데이터가 부족합니다.');
    }

    const mergedSubjects = this.mergeSubjects(exams);
    const prompt = this.createPrompt(mergedSubjects, preference);

    const raw = await this.llmClient.generate(prompt);  // 이미 object[]로 반환됨

    if (!Array.isArray(raw)) {
      console.error('❌ LLM 응답이 배열이 아님:', raw);
      throw new InternalServerErrorException('LLM 응답이 JSON 배열 형식이 아닙니다.');
    }

    return raw;
  }

  private mergeSubjects(exams: any[]): any[] {
    const grouped: Record<string, any> = {};

    for (const exam of exams) {
      const key = exam.subject;
      if (!grouped[key]) {
        grouped[key] = {
          subject: exam.subject,
          startDate: exam.startDate,
          endDate: exam.endDate,
          chapters: [...exam.chapters],
        };
      } else {
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

  private createPrompt(subjects: Subject[], pref: Preference): string {
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
        .map((ch, i) => `Chapter ${i + 1}: ${ch.chapterTitle}`) // 페이지 정보 있다면 (p.XX-YY) 붙이기
        .join(', ');
      lines.push(
        `- Subject: ${subj.subject}`,
        `  Period: ${new Date(subj.startDate).toDateString()} ~ ${new Date(subj.endDate).toDateString()}`,
        `  Chapters: ${chapters}`,
        ""
      );
    }

    return lines.join('\n');
  }
}
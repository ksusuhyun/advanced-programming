import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserPreferenceService } from '../../user-preference/user-preference.service';
import { ExamService } from '../../exam/exam.service';
import { SyncToNotionDto } from '../../notion/dto/sync-to-notion.dto';
import { NotionService } from '../../notion/notion.service';
import { LlmClientService } from '../server/llm-client.service';
import { getAllStudyDates } from './utils/date-utils';
import { createPrompt } from './engine/llm-planner';

interface Chapter {
  chapterTitle: string;
  contentVolume: number;
  difficulty: string; // '상', '중', '하'
}

interface Subject {
  subject: string;
  startDate: string;
  endDate: string;
  importance: number;
  chapters: Chapter[];
}

interface EstimatedChapter {
  subject: string;
  title: string;
  contentVolume: number;
  estimatedDays: number;
}

@Injectable()
export class AiPlannerService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userPreferenceService: UserPreferenceService,
    private readonly examService: ExamService,
    private readonly notionService: NotionService,
    private readonly llmClient: LlmClientService,
  ) {}

  async generateStudyPlanByUserId(userId: string): Promise<SyncToNotionDto[]> {
    const preference = await this.userPreferenceService.findByUserId(userId);
    const style = await this.userPreferenceService.getStyle(userId);
    const { exams } = await this.examService.findByUser(userId);
    if (!preference || !exams || exams.length === 0) {
      throw new InternalServerErrorException('❌ 유저 정보 또는 시험 데이터가 부족합니다.');
    }

    const databaseId = this.configService.get<string>('DATABASE_ID');
    if (!databaseId) throw new InternalServerErrorException('❌ DATABASE_ID 누락');

    const useLLM = this.configService.get<string>('USE_LLM')?.toLowerCase() === 'true';

    const mergedSubjects = this.mergeSubjects(exams);
    const estimates = this.estimateDaysByDifficulty(mergedSubjects);
    const studyDates = getAllStudyDates(mergedSubjects, preference.studyDays);

    let rawPlans: any[] = [];

    if (useLLM) {
      try {
        const prompt = createPrompt(estimates as any, studyDates, preference.sessionsPerDay, style);
        rawPlans = await this.llmClient.generate(prompt);
        if (!Array.isArray(rawPlans)) throw new Error('Invalid LLM output');
      } catch (e) {
        console.warn('⚠️ LLM 실패 - fallback 사용:', (e as Error).message);
        rawPlans = this.assignChaptersFallback(estimates, studyDates, preference.sessionsPerDay);
      }
    } else {
      rawPlans = this.assignChaptersFallback(estimates, studyDates, preference.sessionsPerDay);
    }

    const results = this.groupDailyPlansBySubject(userId, databaseId, mergedSubjects, rawPlans);
    for (const result of results) {
      await this.notionService.syncToNotion(result);
    }

    return this.mapResponseForClient(results);
  }

  private estimateDaysByDifficulty(subjects: Subject[]): EstimatedChapter[] {
    const diffWeight = { 상: 1.5, 중: 1.0, 하: 0.7 };
    const result: EstimatedChapter[] = [];

    for (const subject of subjects) {
      for (const chapter of subject.chapters) {
        const factor = diffWeight[chapter.difficulty] || 1.0;
        const days = Math.ceil((chapter.contentVolume * factor) / 10);
        result.push({
          subject: subject.subject,
          title: chapter.chapterTitle,
          contentVolume: chapter.contentVolume,
          estimatedDays: days,
        });
      }
    }
    return result;
  }

  private assignChaptersFallback(
    chapters: EstimatedChapter[],
    dates: string[],
    maxPerDay: number
  ): { subject: string; date: string; content: string }[] {
    const result: any[] = [];
    let idx = 0;

    for (const date of dates) {
      for (let s = 0; s < maxPerDay && idx < chapters.length; s++, idx++) {
        const item = chapters[idx];
        result.push({
          subject: item.subject,
          date,
          content: `${item.title} (p.${item.contentVolume})`,
        });
      }
    }

    return result;
  }

  private mapResponseForClient(results: SyncToNotionDto[]): any[] {
    return results.map(({ subject, startDate, endDate, dailyPlan }) => ({
      subject,
      startDate,
      endDate,
      dailyPlan,
    }));
  }

  private groupDailyPlansBySubject(
    userId: string,
    databaseId: string,
    subjects: Subject[],
    llmResponse: any[],
  ): SyncToNotionDto[] {
    const groupedBySubject: Record<string, SyncToNotionDto> = {};

    for (const item of llmResponse) {
      const subjectKey = item.subject;
      if (!groupedBySubject[subjectKey]) {
        const matched = subjects.find(s => s.subject === subjectKey);
        if (!matched) throw new Error(`❌ 과목 일치 실패: ${subjectKey}`);
        groupedBySubject[subjectKey] = {
          userId,
          subject: subjectKey,
          startDate: matched.startDate.toString(),
          endDate: matched.endDate.toString(),
          dailyPlan: [],
          databaseId,
        };
      }
      groupedBySubject[subjectKey].dailyPlan.push(`${item.date}: ${item.content}`);
    }

    return Object.values(groupedBySubject);
  }

  private mergeSubjects(exams: any[]): Subject[] {
    const grouped: Record<string, any> = {};
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
}

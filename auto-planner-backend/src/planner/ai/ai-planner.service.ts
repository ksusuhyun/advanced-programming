import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserPreferenceService } from '../../user-preference/user-preference.service';
import { ExamService } from '../../exam/exam.service';
import { SyncToNotionDto } from '../../notion/dto/sync-to-notion.dto';
import { NotionService } from '../../notion/notion.service';
import { LlmClientService } from '../server/llm-client.service';
import { getAllStudyDates } from './utils/date-utils';

interface Chapter {
  chapterTitle: string;
  contentVolume: number;
  difficulty: string;
}

interface Subject {
  subject: string;
  startDate: string;
  endDate: string;
  chapters: Chapter[];
}

interface ChapterSlice {
  subject: string;
  title: string;
  pageRange: string;
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
    console.log('📥 generateStudyPlanByUserId called for:', userId);
    const preference = await this.userPreferenceService.findByUserId(userId);
    const style = await this.userPreferenceService.getStyle(userId);
    const { exams } = await this.examService.findByUser(userId);
    if (!preference || !exams || exams.length === 0) {
      throw new InternalServerErrorException('❌ 유저 정보 또는 시험 데이터가 부족합니다.');
    }

    const databaseId = this.configService.get<string>('DATABASE_ID');
    if (!databaseId) throw new InternalServerErrorException('❌ DATABASE_ID 누락');

    const useLLM = this.configService.get<string>('USE_LLM')?.toLowerCase() === 'true';
    console.log('🧪 USE_LLM =', useLLM);

    const mergedSubjects = this.mergeSubjects(exams);
    console.log('🧪 mergedSubjects count:', mergedSubjects.length);

    const slices = this.flattenChapters(mergedSubjects);
    console.log('🧪 Total chapter slices:', slices.length);

    const dates = getAllStudyDates(mergedSubjects, preference.studyDays);
    console.log('🧪 Study dates:', dates);

    let rawPlans: any[] = [];

    if (useLLM) {
      try {
        const prompt = this.createPromptWithConstraints(slices, dates, preference, style);
        console.log('📤 Generated prompt for LLM:', prompt);
        rawPlans = await this.llmClient.generate(prompt);
        console.log('📥 LLM raw response received:', rawPlans);
        if (!Array.isArray(rawPlans)) throw new Error('Invalid LLM output');
      } catch (e) {
        console.warn('⚠️ LLM 실패 - fallback 사용:', (e as Error).message);
        rawPlans = this.assignChaptersByRule(slices, dates, preference.sessionsPerDay);
        console.log('✅ fallback generated plan count:', rawPlans.length);
      }
    } else {
      console.log('⚠️ USE_LLM=false 설정 - fallback 실행');
      rawPlans = this.assignChaptersByRule(slices, dates, preference.sessionsPerDay);
      console.log('✅ fallback generated plan count:', rawPlans.length);
    }

    const results = this.groupDailyPlansBySubject(userId, databaseId, mergedSubjects, rawPlans);
    for (const result of results) {
      console.log('📌 Notion 동기화 시작 for subject:', result.subject);
      await this.notionService.syncToNotion(result);
      console.log('📌 Notion 동기화 완료 for subject:', result.subject);
    }

    console.log('✅ 전체 과정 완료. 결과 개수:', results.length);
    return this.mapResponseForClient(results);
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
          startDate: matched.startDate,
          endDate: matched.endDate,
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

  private sliceChapter(chapter: Chapter): ChapterSlice[] {
    const { chapterTitle, contentVolume } = chapter;
    const pagesPerSlice = 10;
    const slices: ChapterSlice[] = [];

    let pageStart = 1;
    while (pageStart <= contentVolume) {
      const pageEnd = Math.min(pageStart + pagesPerSlice - 1, contentVolume);
      slices.push({
        title: chapterTitle,
        pageRange: `(p.${pageStart}-${pageEnd})`,
        subject: '',
      });
      pageStart = pageEnd + 1;
    }
    return slices;
  }

  private flattenChapters(subjects: Subject[]): ChapterSlice[] {
    const slices: ChapterSlice[] = [];
    for (const subject of subjects) {
      for (const chapter of subject.chapters) {
        const chapterSlices = this.sliceChapter(chapter);
        slices.push(...chapterSlices.map(slice => ({ ...slice, subject: subject.subject })));
      }
    }
    return slices;
  }

  private createPromptWithConstraints(
    slices: ChapterSlice[],
    allowedDates: string[],
    pref: any,
    style: 'focus' | 'multi',
  ): string {
    const lines: string[] = [];

    lines.push(`너는 AI 학습 계획 생성기야.`);
    lines.push(`다음 챕터 목록을 가능한 날짜에 맞춰 적절히 분배해.`);
    lines.push(`조건은 다음과 같아:`);
    lines.push(`- 하루 최대 ${pref.sessionsPerDay || 2}개의 챕터까지만 배정 가능`);
    lines.push(`- 가능한 날짜: ${allowedDates.join(', ')}`);
    if (style === 'focus') {
      lines.push(`- 하루에는 반드시 하나의 과목만 포함되도록 구성해줘`);
    }
    lines.push(`- 출력은 반드시 JSON 배열 형식, 항목은 subject, date, content만 포함해야 해`);
    lines.push(`- 설명이나 print문, 코드블럭 포함하지 마`);

    lines.push(`\n챕터 목록:`);
    slices.forEach((s, i) => {
      lines.push(`${i + 1}. ${s.subject} - ${s.title} ${s.pageRange}`);
    });

    return lines.join('\n');
  }

  private assignChaptersByRule(
    slices: ChapterSlice[],
    studyDates: string[],
    maxPerDay: number
  ): { subject: string; date: string; content: string }[] {
    const result: { subject: string; date: string; content: string }[] = [];
    let i = 0;

    const sortedDates = [...studyDates].sort((a, b) => {
      const aD = new Date(`2025-${a}`);
      const bD = new Date(`2025-${b}`);
      return aD.getTime() - bD.getTime();
    });

    console.log('📆 fallback slices:', slices.length);
    console.log('📆 fallback dates:', sortedDates);

    for (const date of sortedDates) {
      for (let j = 0; j < maxPerDay && i < slices.length; j++, i++) {
        const s = slices[i];
        result.push({
          subject: s.subject,
          date,
          content: `${s.title} ${s.pageRange}`,
        });
      }
      if (i >= slices.length) break;
    }

    if (result.length < slices.length) {
      console.warn(`⚠️ fallback 계획이 전체 slice ${slices.length}개 중 ${result.length}개만 배정됨`);
    }

    return result;
  }
}

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserPreferenceService } from '../../user-preference/user-preference.service';
import { ExamService } from '../../exam/exam.service';
import { SyncToNotionDto } from '../../notion/dto/sync-to-notion.dto';
import { NotionService } from '../../notion/notion.service';
import { LlmClientService } from '../server/llm-client.service';
import { eachDayOfInterval, format, parseISO } from 'date-fns';

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
    const preference = await this.userPreferenceService.findByUserId(userId);
    const style = await this.userPreferenceService.getStyle(userId);
    const { exams } = await this.examService.findByUser(userId);
    if (!preference || !exams || exams.length === 0) {
      throw new InternalServerErrorException('❌ 유저 정보 또는 시험 데이터가 부족합니다.');
    }

    const databaseId = this.configService.get<string>('DATABASE_ID');
    if (!databaseId) throw new InternalServerErrorException('❌ DATABASE_ID 누락');

    const mergedSubjects = this.mergeSubjects(exams);
    const slices = this.flattenChapters(mergedSubjects);
    const dates = this.getAllStudyDates(mergedSubjects, preference.studyDays);

    const prompt = this.createPromptWithConstraints(slices, dates, preference, style);
    const llmResult = await this.llmClient.generate(prompt);
    if (!Array.isArray(llmResult)) throw new Error('❌ LLM 응답 오류');

    const results = this.groupDailyPlansBySubject(userId, databaseId, mergedSubjects, llmResult);
    for (const result of results) await this.notionService.syncToNotion(result);

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

  private getAllStudyDates(subjects: Subject[], studyDays: string[]): string[] {
    const dayMap: Record<string, number> = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
      Thursday: 4, Friday: 5, Saturday: 6,
    };
    const allowed = studyDays.map(d => dayMap[d]);
    const allDates: Set<string> = new Set();

    for (const subj of subjects) {
      const interval = eachDayOfInterval({
        start: parseISO(subj.startDate),
        end: parseISO(subj.endDate),
      });
      for (const d of interval) {
        if (allowed.includes(d.getDay())) {
          allDates.add(format(d, 'M/d'));
        }
      }
    }
    return Array.from(allDates).sort();
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
}

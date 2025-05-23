import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserPreferenceService } from '../../user-preference/user-preference.service';
import { ExamService } from '../../exam/exam.service';
import { LLMClientService } from './llm-client.service';
import { SyncToNotionDto } from '../../notion/dto/sync-to-notion.dto';
import { NotionService } from '../../notion/notion.service';


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

const PAGE_LIMIT_BY_DIFFICULTY: Record<string, number> = {
  '상': 5,
  '중': 10,
  '하': 15,
};

@Injectable()
export class AiPlannerService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userPreferenceService: UserPreferenceService,
    private readonly examService: ExamService,
    private readonly llmClient: LLMClientService,
    private readonly notionService: NotionService,
  ) {}

  async generateStudyPlanByUserId(userId: string): Promise<SyncToNotionDto[]> {
    const preference = await this.userPreferenceService.findByUserId(userId);
    const { exams } = await this.examService.findByUser(userId);

    if (!preference || !exams || exams.length === 0) {
      throw new InternalServerErrorException('❌ 유저 정보 또는 시험 데이터가 부족합니다.');
    }

    const mergedSubjects = this.mergeSubjects(exams);
    const chapterSlices = this.flattenChapters(mergedSubjects);
    const prompt = this.createPromptFromSlices(chapterSlices, preference);

    const raw = await this.llmClient.generate(prompt);

    if (!Array.isArray(raw)) {
      throw new InternalServerErrorException('LLM 응답이 JSON 배열 형식이 아닙니다.');
    }

    const databaseId = this.configService.get('DATABASE_ID');
    const notionDtos = this.groupDailyPlansBySubject(userId, databaseId, mergedSubjects, raw);

    // ✅ Notion 연동 수행
    for (const dto of notionDtos) {
      await this.notionService.syncToNotion(dto);
    }

    return notionDtos; // optional: Notion에 등록된 정보도 반환

  }

  private groupDailyPlansBySubject(
    userId: string,
    databaseId: string,
    subjects: Subject[],
    llmResponse: any[]
  ): SyncToNotionDto[] {
    const grouped: Record<string, string[]> = {};

    for (const item of llmResponse) {
      if (!grouped[item.subject]) {
        grouped[item.subject] = [];
      }
      grouped[item.subject].push(`${item.date}: ${item.content}`);
    }

    return Object.entries(grouped).map(([subject, dailyPlan]) => {
      const matchedSubject = subjects.find((s) => s.subject === subject);
      if (!matchedSubject) throw new Error(`❌ 과목 일치 실패: ${subject}`);

      return {
        userId,
        subject,
        startDate: matchedSubject.startDate,
        endDate: matchedSubject.endDate,
        dailyPlan,
        databaseId,
      };
    });
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
    const { chapterTitle, contentVolume, difficulty } = chapter;
    const limit = PAGE_LIMIT_BY_DIFFICULTY[difficulty] ?? 10;
    const slices: ChapterSlice[] = [];

    let pageStart = 1;
    while (pageStart <= contentVolume) {
      const pageEnd = Math.min(pageStart + limit - 1, contentVolume);
      slices.push({
        title: chapterTitle,
        pageRange: `(p.${pageStart}-${pageEnd})`,
        subject: '', // subject는 나중에 추가됨
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

  private createPromptFromSlices(slices: ChapterSlice[], pref: any): string {
    const lines = [
      '# You are a planner assistant.',
      '# Given the list of chapter slices, assign them to study days within the allowed period.',
      `# Each day can contain up to ${pref.sessionsPerDay} items.`,
      `# Use only the allowed weekdays: ${pref.studyDays.join(', ')}`,
      '# Output only JSON array like:',
      '# [{ "subject": "...", "date": "6/1", "content": "챕터명 (p.1-5)" }, ...]',
      '',
      'Slices:'
    ];

    lines.push(...slices.map((s, i) => `${i + 1}. ${s.subject} - ${s.title} ${s.pageRange}`));

    return lines.join('\n');
  }
}

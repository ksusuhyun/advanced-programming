import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserPreferenceService } from '../../user-preference/user-preference.service';
import { ExamService } from '../../exam/exam.service';
import axios from 'axios';
import { format, parseISO, addDays, isBefore } from 'date-fns';

@Injectable()
export class AiPlannerService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userPreferenceService: UserPreferenceService,
    private readonly examService: ExamService,
  ) {}

  async generateStudyPlanByUserId(userId: string): Promise<any> {
    const preference = await this.userPreferenceService.findByUserId(userId);
    const { exams } = await this.examService.findByUser(userId);

    if (!preference || !exams || exams.length === 0) {
      throw new InternalServerErrorException('필수 정보가 부족합니다.');
    }

    const mergedSubjects = this.mergeSubjects(exams);

    const prompt = this.createPrompt(mergedSubjects, preference);
    const HF_API_URL = 'http://localhost:8000/v1/completions'; // 로컬내에서 돌리기 위해 아래 코드에서 수정

    const response = await axios.post(HF_API_URL, {
      model: 'openchat',  // 또는 실제 로컬에 올려놓은 모델 이름
      prompt: prompt,     // 이미 위에서 만든 프롬프트
      max_tokens: 1024,
      temperature: 0.7,
    });

    // const hfApiKey = this.configService.get<string>('HF_API_KEY');
    // const hfModel = this.configService.get<string>('HF_MODEL');
    // const HF_API_URL = `https://api-inference.huggingface.co/models/${hfModel}`;

    // const headers = {
    //   Authorization: `Bearer ${hfApiKey}`,
    //   'Content-Type': 'application/json',
    // };

    // const response = await axios.post(HF_API_URL, { inputs: prompt }, { headers, timeout: 120000 });

    const rawText = response.data?.[0]?.generated_text ?? response.data;
    const jsonMatch = rawText.match(/\[\s*{[\s\S]*?}\s*\]/);

    if (!jsonMatch) {
      console.error('❌ JSON 파싱 실패:', rawText);
      throw new InternalServerErrorException('AI 응답이 올바른 JSON 배열 형식이 아닙니다.');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  }

  private mergeSubjects(exams: any[]) {
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
        if (isBefore(new Date(exam.startDate), new Date(grouped[key].startDate))) {
          grouped[key].startDate = exam.startDate;
        }
        if (new Date(exam.endDate) > new Date(grouped[key].endDate)) {
          grouped[key].endDate = exam.endDate;
        }
        grouped[key].chapters.push(...exam.chapters);
      }
    }

    return Object.values(grouped);
  }

  private createPrompt(subjects: any[], pref: any): string {
    const lines = [
      'You are an AI that returns ONLY a JSON array in the following format:',
      '[{"subject": "과목명", "startDate": "yyyy-MM-dd", "endDate": "yyyy-MM-dd", "dailyPlan": ["6/1: 과목명 - 챕터명"]}]',
      '',
      'DO NOT add any explanation, headers, or notes.',
      '',
      `User Preferences:`,
      `- Style: ${pref.style === 'focus' ? 'Focused' : 'Multi'}`,
      `- Study Days: ${pref.studyDays.join(', ')}`,
      `- Sessions per Day: ${pref.sessionsPerDay}`,
      '',
      'Exams:',
    ];

    for (const subj of subjects) {
      const chapters = subj.chapters.map((ch, i) => `Chapter ${i + 1}: ${ch.chapterTitle}`).join(', ');
      lines.push(
        `- Subject: ${subj.subject}`,
        `  Period: ${new Date(subj.startDate).toDateString()} ~ ${new Date(subj.endDate).toDateString()}`,
        `  Chapters: ${chapters}`,
        ''
      );
    }

    lines.push('Only return the JSON array.');
    return lines.join('\n');
  }
}

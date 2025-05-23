// utils/aiMapper.ts
import { ChapterDto } from '../dto/ai-planner.dto';;
import { getStudyDates } from './date-utils';
import axios from 'axios';

export async function generateAIBasedPlan(
  chapters: ChapterDto[],
  startDate: string,
  endDate: string,
  studyDays: string[],
  subject: string
): Promise<string[]> {
  // 날짜 생성 (정확한 요일 계산은 코드가 함)
  const dates = getStudyDates(startDate, endDate, studyDays);

  // 챕터 타이틀만 추출
  const chapterSummaries = chapters.map(
    (ch, i) => `Chapter ${i + 1}: ${ch.chapterTitle} (${ch.contentVolume}p, ${ch.difficulty})`
  ).join('\n');

  // LLM 프롬프트 작성
  const prompt = `
You are a study planner assistant.
Distribute the following chapters across the study dates based on the order and their difficulty and volume.
Only respond with a JSON array like ["6/1: subject - chapter title (p.x-y)", ...]. Do not include any explanation.

Study Dates: ${dates.join(', ')}
Subject: ${subject}
Chapters:
${chapterSummaries}`.trim();

  const response = await axios.post('http://localhost:8000/v1/completions', {
    model: 'falcon-rw-1b',
    prompt,
    max_tokens: 1024,
    temperature: 0.0,
  });

  try {
    return JSON.parse(response.data[0].generated_text);
  } catch (e) {
    console.error('❌ JSON parsing error:', response.data[0].generated_text);
    return [];
  }
}

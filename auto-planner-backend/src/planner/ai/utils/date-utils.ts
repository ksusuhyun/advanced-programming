import { eachDayOfInterval, format } from 'date-fns';

interface Subject {
  subject: string;
  startDate: string;
  endDate: string;
}

export function getAllStudyDates(subjects: Subject[], studyDays: string[]): string[] {
  const dayMap: Record<string, number> = {
    '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6,
  };

  console.log('📋 받은 studyDays:', studyDays);
  const allowed = studyDays.map(day => dayMap[day]).filter(d => d !== undefined);
  console.log('✅ 매핑된 요일 숫자:', allowed);

  const allDates: Set<string> = new Set();

  for (const subj of subjects) {
    console.log('📅 과목 기간:', subj.subject, subj.startDate, '→', subj.endDate);
    
    const interval = eachDayOfInterval({
      start: new Date(subj.startDate),
      end: new Date(subj.endDate),
    });

    for (const d of interval) {
      const dayOfWeek = d.getDay();
      if (allowed.includes(dayOfWeek)) {
        const formatted = format(d, 'yyyy-MM-dd'); // 날짜 포맷을 yyyy-MM-dd로 통일
        allDates.add(formatted);
        console.log('📆 추가된 날짜:', formatted, '요일:', dayOfWeek);
      }
    }
  }

  const sorted = Array.from(allDates).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  console.log('✅ 전체 학습 가능 날짜:', sorted);
  return sorted;
}

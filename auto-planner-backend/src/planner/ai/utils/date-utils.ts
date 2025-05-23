import { format, parseISO, eachDayOfInterval } from 'date-fns';

export function getStudyDates(start: string, end: string, studyDays: string[]): string[] {
  const dayMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const allowedDays = studyDays.map(day => dayMap[day]);

  return eachDayOfInterval({ start: parseISO(start), end: parseISO(end) })
    .filter(date => allowedDays.includes(date.getDay()))
    .map(date => format(date, 'yyyy-MM-dd'));
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'; // 경로는 프로젝트 구조에 따라 조정
import { CreateExamDto } from './dto/create-exam.dto';

@Injectable()
export class ExamService {
  constructor(private prisma: PrismaService) {}

// exam.service.ts
  async create(exam: CreateExamDto) {
    // 1. 문자열 userId로 내부 user.id 찾기
    const user = await this.prisma.user.findUnique({
      where: { userId: exam.userId },
    });

    if (!user) {
      throw new Error(`User with userId '${exam.userId}' not found`);
    }

    // 2. exam 저장 (user.id로 연결)
    const created = await this.prisma.exam.create({
      data: {
        subject: exam.subject,
        startDate: new Date(exam.startDate),
        endDate: new Date(exam.endDate),
        importance: exam.importance,
        userId: user.id,
        chapters: {
          create: exam.chapters.map((ch) => ({
            chapterTitle: ch.chapterTitle,
            difficulty: String(ch.difficulty),
            contentVolume: ch.contentVolume,
          })),
        },
      },
      include: { chapters: true },
    });

    return {
      message: '시험 정보 등록 완료',
      data: created,
    };
  }
  // exam.service.ts
async findByUser(userId: string) {
  const user = await this.prisma.user.findUnique({ where: { userId } });
  if (!user) return { userId, exams: [] };

  const exams = await this.prisma.exam.findMany({
    where: { userId: user.id },
    include: { chapters: true },
  });

  return { userId, exams };
}

async findLatestByUserId(userId: string) {
  const user = await this.prisma.user.findUnique({ where: { userId } });
  if (!user) return null;

  return await this.prisma.exam.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { chapters: true },
  });
}

async deleteExamWithChaptersByUser(userId: string, subject: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });
    if (!user) throw new Error('사용자를 찾을 수 없습니다.');

    const exam = await this.prisma.exam.findFirst({
      where: {
        userId: user.id,
        subject,
      },
    });
    if (!exam) {
      return { message: '해당 과목의 시험 정보가 없습니다.' };
    }

    await this.prisma.chapter.deleteMany({
      where: {
        examId: exam.id,
      },
    });

    await this.prisma.exam.delete({
      where: {
        id: exam.id,
      },
    });

    return {
      message: `과목 "${subject}"에 대한 시험과 챕터가 삭제되었습니다.`,
    };
  }
}
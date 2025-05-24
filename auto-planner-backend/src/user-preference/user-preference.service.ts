import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserPreferenceDto } from './dto/user-preference.dto';

export interface StudyPreference {
  style: string; // 예: 'simple' | 'ai' | 'creative'
  studyDays: string[];
  sessionsPerDay: number;
}

@Injectable()
export class UserPreferenceService {
  constructor(private readonly prisma: PrismaService) {}

  async save(userId: string, dto: UserPreferenceDto) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException(`User ID ${userId} not found`);
    }

    const existing = await this.prisma.studyPreference.findUnique({
      where: { userId: user.id },
    });

    const data = {
      style: dto.style,
      studyDays: dto.studyDays,
      sessionsPerDay: dto.sessionsPerDay,
      user: { connect: { id: user.id } },
    };

    if (existing) {
      return this.prisma.studyPreference.update({
        where: { userId: user.id },
        data,
      });
    } else {
      return this.prisma.studyPreference.create({ data });
    }
  }

  /**
   * 사용자 ID로부터 studyPreference 조회
   * @returns style, studyDays, sessionsPerDay 포함 객체
   */
  async findByUserId(userId: string): Promise<StudyPreference> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: { preference: true },
    });

    if (!user || !user.preference) {
      throw new NotFoundException(`User ID ${userId} preference not found`);
    }

    return {
      style: user.preference.style,
      studyDays: user.preference.studyDays,
      sessionsPerDay: user.preference.sessionsPerDay,
    };
  }

  async getStyle(userId: string): Promise<'focus' | 'multi'> {
    const pref = await this.findByUserId(userId);
    return pref.style as 'focus' | 'multi';
  }
}

import { PrismaService } from '../prisma/prisma.service';
import { UserPreferenceDto } from './dto/user-preference.dto';
export interface StudyPreference {
    style: string;
    studyDays: string[];
    sessionsPerDay: number;
}
export declare class UserPreferenceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    save(userId: string, dto: UserPreferenceDto): Promise<{
        id: number;
        style: string;
        studyDays: string[];
        sessionsPerDay: number;
        userId: number;
    }>;
    findByUserId(userId: string): Promise<StudyPreference>;
    getStyle(userId: string): Promise<'focus' | 'multi'>;
}

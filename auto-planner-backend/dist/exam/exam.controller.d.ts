import { CreateExamDto } from './dto/create-exam.dto';
import { ExamService } from './exam.service';
export declare class ExamController {
    private readonly examService;
    constructor(examService: ExamService);
    create(createExamDto: CreateExamDto): Promise<{
        message: string;
        data: {
            chapters: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                chapterTitle: string;
                difficulty: number;
                contentVolume: number;
                examId: number;
            }[];
        } & {
            id: number;
            subject: string;
            startDate: Date;
            endDate: Date;
            importance: number;
            userId: number;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    findByUser(userId: string): Promise<{
        userId: string;
        exams: ({
            chapters: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                chapterTitle: string;
                difficulty: number;
                contentVolume: number;
                examId: number;
            }[];
        } & {
            id: number;
            subject: string;
            startDate: Date;
            endDate: Date;
            importance: number;
            userId: number;
            createdAt: Date;
            updatedAt: Date;
        })[];
    }>;
    deleteExamBySubject(userId: string, subject: string): Promise<{
        message: string;
    }>;
    deleteAllExams(userId: string): Promise<{
        message: string;
    }>;
}

export declare class AiGeneratePlanDto {
    subject: string;
    startDate: string;
    endDate: string;
    importance: number;
    chapters: {
        chapterTitle: string;
        difficulty: number;
        contentVolume: number;
    }[];
}

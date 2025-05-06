import { ApiProperty } from '@nestjs/swagger';
import { ChapterInfoDto } from '../../exam/dto/chapter-info.dto';

export class GeneratePlanDto {
  @ApiProperty({ example: 'user123' })
  userId: string;

  @ApiProperty({ example: '수학' })
  subject: string;

  @ApiProperty({ example: '2025-06-01' })
  startDate: string;

  @ApiProperty({ example: '2025-06-15' })
  endDate: string;

  @ApiProperty({ example: 4 })
  importance: number;

  @ApiProperty({ type: [ChapterInfoDto] })
  chapters: ChapterInfoDto[];

  @ApiProperty({ example: '집중 잘 되는 아침형' })
  studyPreference: string;
}

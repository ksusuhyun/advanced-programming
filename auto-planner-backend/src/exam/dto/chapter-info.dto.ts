import { ApiProperty } from '@nestjs/swagger';

export class ChapterInfoDto {
  @ApiProperty({ example: 'Chapter 1: Introduction' })
  chapterTitle: string;

  @ApiProperty({ example: 3, description: '난이도 (1~5)' })
  difficulty: number;

  @ApiProperty({ example: 10, description: '내용 분량' })
  contentVolume: number;
}

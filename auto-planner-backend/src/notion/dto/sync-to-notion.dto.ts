// import { ApiProperty } from '@nestjs/swagger';

// export class SyncToNotionDto {
//   @ApiProperty({ example: 'user123' })
//   userId: string;

//   @ApiProperty({ example: '수학' })
//   subject: string;

//   @ApiProperty({ example: '2025-06-01' })
//   startDate: string;

//   @ApiProperty({ example: '2025-06-15' })
//   endDate: string;

//   @ApiProperty({ example: ['6/1: 수열의 개념', '6/2: 등차수열'] })
//   dailyPlan: string[];

//   databaseId: string;
// }

import { ApiProperty } from '@nestjs/swagger';

export class SyncToNotionDto {
  @ApiProperty({ example: 'user123', description: '사용자 고유 ID' })
  userId: string;

  @ApiProperty({ example: '수학', description: '과목명' })
  subject: string;

  @ApiProperty({ example: '2025-06-01', description: '학습 시작일 (yyyy-MM-dd)' })
  startDate: string;

  @ApiProperty({ example: '2025-06-15', description: '학습 종료일 (yyyy-MM-dd)' })
  endDate: string;

  @ApiProperty({
    example: ['6/1: 수열의 개념', '6/2: 등차수열'],
    description: '날짜별 학습 계획 목록 ("M/d: 내용") 형식의 문자열 배열'
  })
  dailyPlan: string[];

  @ApiProperty({ example: 'notion-db-id-abc123', description: 'Notion 데이터베이스 ID' })
  databaseId: string;
}


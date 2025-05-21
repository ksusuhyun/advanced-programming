import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPlanDto {
  @ApiProperty({ example: '202255179' })
  userId: string;

  @ApiProperty({ example: '고급 프로그래밍' })
  subject: string;

  @ApiProperty({ example: '2025-06-01' })
  startDate: string;

  @ApiProperty({ example: '2025-06-15' })
  endDate: string;

  @ApiProperty({ example: ['6/1: Chapter 1', '6/2: Chapter 2'] })
  dailyPlan: string[];

  @ApiProperty({ example: "1f462039491480a48452f3bd7436ffd2" })
  databaseId: string;
}

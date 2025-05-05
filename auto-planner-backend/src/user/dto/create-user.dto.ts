import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: '202255179' })
  userId: string;

  @ApiProperty({ example: 'yuhuijeong' })
  password: string;

  @ApiProperty({ example: '새벽형' })
  studyPreference: string;
}

import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user123' })
  userId: string;

  @ApiProperty({ example: 'securepassword' })
  password: string;

  @ApiProperty({ example: '집중 잘 되는 아침형' })
  studyPreference: string;
}

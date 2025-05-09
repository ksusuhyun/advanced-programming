import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  private users: CreateUserDto[] = []; // 메모리 저장 (임시)

  create(createUserDto: CreateUserDto) {
    this.users.push(createUserDto);
    return {
      message: '사용자 등록 성공',
      data: createUserDto,
    };
  }

  findOne(id: string) {
    const user = this.users.find(u => u.userId === id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}

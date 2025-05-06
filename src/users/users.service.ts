import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private users: User[] = [];

  findAll(): User[] {
    return this.users;
  }

  create(userDto: CreateUserDto): User {
    const user: User = {
      id: Date.now(),
      ...(userDto as Omit<User, 'id'>),
    };
    this.users.push(user);
    return user;
  }
}

import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private users;
    findAll(): User[];
    create(userDto: CreateUserDto): User;
}

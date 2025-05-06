import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): import("./user.entity").User[];
    create(body: CreateUserDto): import("./user.entity").User;
}

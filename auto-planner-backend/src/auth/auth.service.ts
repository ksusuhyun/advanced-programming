import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(userId: string, password: string) {
    const user = await this.userService.findOne(userId); // ❗ 존재하지 않으면 404 자동 던짐
    if (user.password !== password) {
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');
    }
    return user;
  }

  // async login(dto: LoginDto) {
  //   // ❗ 존재하지 않는 userId면 NotFoundException 발생
  //   const user = await this.validateUser(dto.userId, dto.password);

  //   const payload = { sub: user.userId };
  //   return {
  //     access_token: this.jwtService.sign(payload),
  //   };
  // }

  // userId 명시
  async login(dto: LoginDto) {
  const user = await this.validateUser(dto.userId, dto.password);

  const payload = {
    sub: user.userId,
    userId: user.userId, // ✅ 이 라인 추가!
  };

  return {
    access_token: this.jwtService.sign(payload),
    // userId: user.userId, // 이 라인 추가 방식으로 수정
  };
}


  async signup(dto: CreateUserDto) {
    return await this.userService.create(dto);
  }
}

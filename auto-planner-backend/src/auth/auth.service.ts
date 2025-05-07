import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(userId: string, password: string) {
    try {
      const user = this.userService.findOne(userId);
      if (user.password !== password) {
        return null;
      }
      return user;
    } catch (err) {
      return null; // 사용자가 없으면 null 반환
    }
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.userId, dto.password);

    if (!user) {
      throw new UnauthorizedException('잘못된 사용자 정보입니다.');
    }

    const payload = { sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}

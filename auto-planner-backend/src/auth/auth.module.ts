// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module'; // 👈 추가
import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
  imports: [
    UserModule, 
    JwtModule.register({
      secret: 'secret-key', // 임시 키 (보통 .env에서 관리)
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}

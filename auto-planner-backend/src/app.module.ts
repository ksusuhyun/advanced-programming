import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // ✅ 추가

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ExamModule } from './exam/exam.module';
import { PlannerModule } from './planner/planner.module';
import { NotionModule } from './notion/notion.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // ✅ 환경변수 설정을 전역으로 불러오기
    UserModule,
    ExamModule,
    PlannerModule,
    NotionModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

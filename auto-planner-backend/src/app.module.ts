import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ExamModule } from './exam/exam.module';
import { PlannerModule } from './planner/planner.module';
import { NotionModule } from './notion/notion.module';

@Module({
  imports: [UserModule, ExamModule, PlannerModule, NotionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

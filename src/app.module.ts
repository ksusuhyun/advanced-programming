import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'hamzzi0312',
      password: '',
      database: 'ai_planner',
      synchronize: true,
      entities: [__dirname + '/**/*.entity.{ts,js}'],
    }),
    UsersModule,
  ],
})
export class AppModule {}

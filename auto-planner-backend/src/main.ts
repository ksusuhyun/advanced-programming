import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('AI Planner API')
    .setDescription('AI 기반 시험 계획 생성기')
    .setVersion('1.0')
    .addTag('planner')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);  // 브라우저에서 /api 로 접근

  await app.listen(4521, '0.0.0.0');

}
bootstrap();

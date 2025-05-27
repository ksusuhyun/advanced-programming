// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);

//   const config = new DocumentBuilder()
//     .setTitle('AI Planner API')
//     .setDescription('AI 기반 시험 계획 생성기')
//     .setVersion('1.0')
//     .addTag('planner')
//     .addBearerAuth(  // ✅ 여기를 추가해야 함
//       {
//         type: 'http',
//         scheme: 'bearer',
//         bearerFormat: 'JWT',
//         name: 'Authorization',
//         in: 'header',
//       },
//       'access-token',  // 이름은 아래에서 사용됨
//     )
//     .build();

//   const document = SwaggerModule.createDocument(app, config);
//   SwaggerModule.setup('api', app, document);  // 브라우저에서 /api 로 접근

//   await app.listen(4523, '0.0.0.0');

// }
// bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { saveToken } from './auth/notion-token.store'; // ✅ 추가

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

    // ✅ CORS 설정 추가 (프론트에서 요청 허용)
    app.enableCors({
      origin: ['http://localhost:5173', 'https://advanced-programming.onrender.com', 'http://localhost:5174'],
      credentials: true,
    });  

  const config = new DocumentBuilder()
    .setTitle('AI Planner API')
    .setDescription('AI 기반 시험 계획 생성기')
    .setVersion('1.0')
    .addTag('planner')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // ✅ 테스트용 Notion 토큰 등록
  saveToken('a', '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');  

  // ✅ Render 호환을 위한 포트 설정
  await app.listen(process.env.PORT || 4523, '0.0.0.0');
}
bootstrap();

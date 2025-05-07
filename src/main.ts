import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import * as open from "open"; // 👈 추가

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("AI 플래너 API")
    .setDescription("시험 정보 입력, 계획 생성, 노션 연동 API 문서")
    .setVersion("1.0")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: "AI 플래너 API 문서",
  });

  await app.listen(3450); // 👈 너의 포트 번호로

  // 👇 자동으로 Swagger 페이지 열기
  await open("http://localhost:3450/api");
}
bootstrap();

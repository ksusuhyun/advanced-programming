"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const open = require("open");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const config = new swagger_1.DocumentBuilder()
        .setTitle("AI 플래너 API")
        .setDescription("시험 정보 입력, 계획 생성, 노션 연동 API 문서")
        .setVersion("1.0")
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup("api", app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
        customSiteTitle: "AI 플래너 API 문서",
    });
    await app.listen(3450);
    await open("http://localhost:3450/api");
}
bootstrap();
//# sourceMappingURL=main.js.map
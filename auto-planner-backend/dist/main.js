"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const cookieParser = require("cookie-parser");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use(cookieParser());
    app.enableCors({
        origin: ['http://localhost:5173', 'https://advanced-programming.onrender.com', 'http://localhost:5174'],
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('AI Planner API')
        .setDescription('AI 기반 시험 계획 생성기')
        .setVersion('1.0')
        .addTag('planner')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
    }, 'access-token')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document, {
        swaggerOptions: {
            withCredentials: true,
        },
    });
    await app.listen(process.env.PORT || 4523, '0.0.0.0');
}
bootstrap();
//# sourceMappingURL=main.js.map
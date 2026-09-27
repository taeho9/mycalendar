import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Enable CORS
  app.enableCors();

  // 2. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // 3. Global Prefix ('api/v1'), excluding 'health' for Docker/OCI healthchecks
  app.setGlobalPrefix('api/v1', {
    exclude: ['health'],
  });

  // 4. Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('MyCalendar API')
    .setDescription(
      'MyCalendar Collaboration Platform Backend REST API Documentation.\n' +
        'Features: Google OAuth2 2-way sync, Hierarchical M:N Categories, Schedules, Team Collaborations.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Input your JWT Bearer token here',
        in: 'header',
      },
      'access-token',
    )
    .addTag('Auth', 'Google OAuth2 login and authentication endpoints')
    .addTag('Users', 'User profile management endpoints')
    .addTag('Categories', '2-level M:N hierarchical categories and workflow stages')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // 5. Start Server
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application running on: http://localhost:${port}`);
  console.log(`📖 Swagger API Docs: http://localhost:${port}/api/docs`);
  console.log(`🩺 Health check endpoint: http://localhost:${port}/health`);
}
bootstrap();

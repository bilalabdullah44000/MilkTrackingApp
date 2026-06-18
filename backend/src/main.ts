import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get<string>('corsOrigin'),
    credentials: true,
  });

  const port = configService.get<number>('port') || 4000;
  await app.listen(port);
  console.log(`Application running on: http://localhost:${port}/graphql`);
}

bootstrap();

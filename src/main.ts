import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bodyParser: true,
  });

  const config = new DocumentBuilder()
    .setTitle('InstantPower')
    .setDescription('The InstantPower APIs documentation endpoints')
    .setVersion('1.0')
    .addTag('documentation endpoints')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, documentFactory);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: '*',
  });
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
}

bootstrap();

import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // eslint-disable-next-line no-process-env
  await app.listen(process.env.PORT || 4000);
}
bootstrap();

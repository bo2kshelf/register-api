import {ConfigType} from '@nestjs/config';
import {NestFactory} from '@nestjs/core';
import appConfig from './app.config';
import {AppModule} from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService: ConfigType<typeof appConfig> = app.get(appConfig.KEY);

  await app.listen(configService.port);
}
bootstrap();

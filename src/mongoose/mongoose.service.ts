import {Inject, Injectable} from '@nestjs/common';
import {ConfigType} from '@nestjs/config';
import {MongooseModuleOptions, MongooseOptionsFactory} from '@nestjs/mongoose';
import {format as formatMongoURI} from 'mongodb-uri';
import mongooseConfig from './mongoose.config';

@Injectable()
export class MongooseService implements MongooseOptionsFactory {
  constructor(
    @Inject(mongooseConfig.KEY)
    private configService: ConfigType<typeof mongooseConfig>,
  ) {}

  createMongooseOptions(): MongooseModuleOptions {
    return {
      uri: formatMongoURI({
        scheme: 'mongodb',
        options: {authSource: 'admin'},
        hosts: this.configService.hosts,
        database: this.configService.database,
        username: this.configService.username,
        password: this.configService.password,
      }),
    };
  }
}

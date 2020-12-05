import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {GraphQLModule} from '@nestjs/graphql';
import {MongooseModule} from '@nestjs/mongoose';
import mongooseConfig from './mongoose/mongoose.config';
import {MongooseService} from './mongoose/mongoose.service';

@Module({
  imports: [
    GraphQLModule.forRoot({
      autoSchemaFile: true,
      context: ({req}) => ({req}),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule.forFeature(mongooseConfig)],
      useClass: MongooseService,
    }),
  ],
})
export class AppModule {}

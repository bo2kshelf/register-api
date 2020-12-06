import {Module} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {Series, SeriesSchema} from './schema/series.schema';
import {SeriesResolver} from './series.resolver';
import {SeriesService} from './series.service';

@Module({
  imports: [
    MongooseModule.forFeature([{name: Series.name, schema: SeriesSchema}]),
  ],
  providers: [SeriesService, SeriesResolver],
  exports: [SeriesService],
})
export class SeriesModule {}

import {Module} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {Book, BookSchema} from '../books/schema/book.schema';
import {Series, SeriesSchema} from './schema/series.schema';
import {SeriesResolver} from './series.resolver';
import {SeriesService} from './series.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Series.name, schema: SeriesSchema},
      {name: Book.name, schema: BookSchema},
    ]),
  ],
  providers: [SeriesService, SeriesResolver],
  exports: [SeriesService],
})
export class SeriesModule {}

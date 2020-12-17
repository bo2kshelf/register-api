import {Module} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {Book, BookSchema} from '../books/schema/book.schema';
import {ObjectIdScalar} from '../scalar/objectid.scalar';
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
  providers: [ObjectIdScalar, SeriesService, SeriesResolver],
  exports: [SeriesService],
})
export class SeriesModule {}

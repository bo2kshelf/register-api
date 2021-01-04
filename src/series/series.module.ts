import {Module} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {Author, AuthorSchema} from '../authors/schema/author.schema';
import {Book, BookSchema} from '../books/schema/book.schema';
import {PaginateModule} from '../paginate/paginate.module';
import {SeriesDocument, SeriesSchema} from './schema/series.schema';
import {SeriesResolver} from './series.resolver';
import {SeriesService} from './series.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: SeriesDocument.name, schema: SeriesSchema},
      {name: Book.name, schema: BookSchema},
      {name: Author.name, schema: AuthorSchema},
    ]),
    PaginateModule,
  ],
  providers: [SeriesService, SeriesResolver],
  exports: [SeriesService],
})
export class SeriesModule {}

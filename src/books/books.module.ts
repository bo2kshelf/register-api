import {Module} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {AuthorDocument, AuthorSchema} from '../authors/schema/author.schema';
import {SeriesDocument, SeriesSchema} from '../series/schema/series.schema';
import {BooksResolver} from './books.resolver';
import {BooksService} from './books.service';
import {
  SeriesBooksConnectionResolver,
  SeriesRelatedBooksConnectionResolver,
} from './connection/series-connection.resolver';
import {BookDocument, BookSchema} from './schema/book.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: BookDocument.name, schema: BookSchema},
      {name: AuthorDocument.name, schema: AuthorSchema},
      {name: SeriesDocument.name, schema: SeriesSchema},
    ]),
  ],
  providers: [
    BooksService,
    BooksResolver,
    SeriesBooksConnectionResolver,
    SeriesRelatedBooksConnectionResolver,
  ],
  exports: [BooksService],
})
export class BooksModule {}

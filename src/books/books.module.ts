import {Module} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {Author, AuthorSchema} from '../authors/schema/author.schema';
import {BooksResolver} from './books.resolver';
import {BooksService} from './books.service';
import {
  SeriesBooksConnectionResolver,
  SeriesRelatedBooksConnectionResolver,
} from './connection/series.connection.resolver';
import {Book, BookSchema} from './schema/book.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Book.name, schema: BookSchema},
      {name: Author.name, schema: AuthorSchema},
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

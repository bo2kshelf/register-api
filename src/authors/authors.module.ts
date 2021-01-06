import {Module} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {BookDocument, BookSchema} from '../books/schema/book.schema';
import {PaginateModule} from '../paginate/paginate.module';
import {SeriesDocument, SeriesSchema} from '../series/schema/series.schema';
import {AuthorsResolver} from './authors.resolver';
import {AuthorsService} from './authors.service';
import {BookAuthorsConnectionResolver} from './connection/book-connection.resolver';
import {AuthorDocument, AuthorSchema} from './schema/author.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: AuthorDocument.name, schema: AuthorSchema},
      {name: BookDocument.name, schema: BookSchema},
      {name: SeriesDocument.name, schema: SeriesSchema},
    ]),
    PaginateModule,
  ],
  providers: [AuthorsService, AuthorsResolver, BookAuthorsConnectionResolver],
  exports: [AuthorsService],
})
export class AuthorsModule {}

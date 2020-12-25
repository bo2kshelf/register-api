import {Module} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {PaginateModule} from '../paginate/paginate.module';
import {AuthorsResolver} from './authors.resolver';
import {AuthorsService} from './authors.service';
import {BookAuthorsConnectionResolver} from './connection/book.connection.resolver';
import {Author, AuthorSchema} from './schema/author.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{name: Author.name, schema: AuthorSchema}]),
    PaginateModule,
  ],
  providers: [AuthorsService, AuthorsResolver, BookAuthorsConnectionResolver],
  exports: [AuthorsService],
})
export class AuthorsModule {}

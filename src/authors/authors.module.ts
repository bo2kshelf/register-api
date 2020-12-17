import {Module} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {ObjectIdScalar} from '../scalar/objectid.scalar';
import {AuthorsResolver} from './authors.resolver';
import {AuthorsService} from './authors.service';
import {AuthorBookConnectionResolver} from './connection/book.connection.resolver';
import {Author, AuthorSchema} from './schema/author.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{name: Author.name, schema: AuthorSchema}]),
  ],
  providers: [
    ObjectIdScalar,
    AuthorsService,
    AuthorsResolver,
    AuthorBookConnectionResolver,
  ],
  exports: [AuthorsService],
})
export class AuthorsModule {}

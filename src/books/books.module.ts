import {Module} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {BooksResolver} from './books.resolver';
import {BooksService} from './books.service';
import {Book, BookSchema} from './schema/book.schema';

@Module({
  imports: [MongooseModule.forFeature([{name: Book.name, schema: BookSchema}])],
  providers: [BooksService, BooksResolver],
  exports: [BooksService],
})
export class BooksModule {}

import {Parent, ResolveField, Resolver} from '@nestjs/graphql';
import {BooksService} from '../books.service';
import {Book} from '../schema/book.schema';
import {
  BookSeriesConnection,
  BookSeriesRelatedBookConnection,
} from './series.connection';

@Resolver(() => BookSeriesConnection)
export class BookSeriesConnectionResolver {
  constructor(private bookService: BooksService) {}

  @ResolveField(() => Book)
  async book(@Parent() {id}: BookSeriesConnection) {
    return this.bookService.getById(id);
  }
}

@Resolver(() => BookSeriesRelatedBookConnection)
export class BookSeriesRelatedBookConnectionResolver {
  constructor(private bookService: BooksService) {}

  @ResolveField(() => Book)
  async book(@Parent() {id}: BookSeriesConnection) {
    return this.bookService.getById(id);
  }
}

import {Parent, ResolveField, Resolver} from '@nestjs/graphql';
import {BooksService} from '../books.service';
import {Book} from '../schema/book.schema';
import {
  SeriesBooksConnection,
  SeriesRelatedBooksConnection,
} from './series.connection';

@Resolver(() => SeriesBooksConnection)
export class SeriesBooksConnectionResolver {
  constructor(private bookService: BooksService) {}

  @ResolveField(() => Book)
  async book(@Parent() {id}: SeriesBooksConnection) {
    return this.bookService.getById(id);
  }
}

@Resolver(() => SeriesRelatedBooksConnection)
export class SeriesRelatedBooksConnectionResolver {
  constructor(private bookService: BooksService) {}

  @ResolveField(() => Book)
  async book(@Parent() {id}: SeriesBooksConnection) {
    return this.bookService.getById(id);
  }
}

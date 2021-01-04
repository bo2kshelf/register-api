import {Parent, ResolveField, Resolver} from '@nestjs/graphql';
import {BooksService} from '../books.service';
import {BookEntity} from '../entity/book.entity';
import {
  SeriesBooksConnection,
  SeriesRelatedBooksConnection,
} from './series-connection.entity';

@Resolver(
  /* istanbul ignore next */
  () => SeriesBooksConnection,
)
export class SeriesBooksConnectionResolver {
  constructor(private bookService: BooksService) {}

  @ResolveField(
    /* istanbul ignore next */
    () => BookEntity,
  )
  async book(@Parent() {id}: SeriesBooksConnection) {
    return this.bookService.getById(id);
  }
}

@Resolver(
  /* istanbul ignore next */
  () => SeriesRelatedBooksConnection,
)
export class SeriesRelatedBooksConnectionResolver {
  constructor(private bookService: BooksService) {}

  @ResolveField(
    /* istanbul ignore next */
    () => BookEntity,
  )
  async book(@Parent() {id}: SeriesBooksConnection) {
    return this.bookService.getById(id);
  }
}

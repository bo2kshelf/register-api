import {Parent, ResolveField, Resolver} from '@nestjs/graphql';
import {BooksService} from '../books.service';
import {Book} from '../schema/book.schema';
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
    () => Book,
  )
  async book(@Parent() {id}: SeriesBooksConnection) {
    return this.bookService.getById(id);
  }
}

@Resolver(
  /* istanbul ignore next */
  () => SeriesRelatedBooksConnection,
)
export class SeriesRelatedBooksConnectionResolver extends SeriesBooksConnectionResolver {}

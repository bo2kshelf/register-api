import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
  ResolveReference,
} from '@nestjs/graphql';
import {ObjectId} from 'mongodb';
import {BookAuthorsConnection} from '../authors/connection/book-connection.entity';
import {SeriesEntity} from '../series/entity/series.entity';
import {BooksService} from './books.service';
import {CreateBookInput} from './dto/create-book.input';
import {Book} from './schema/book.schema';

@Resolver(
  /* istanbul ignore next */
  () => Book,
)
export class BooksResolver {
  constructor(private bookService: BooksService) {}

  @Query(
    /* istanbul ignore next */
    () => Book,
    {nullable: false},
  )
  async book(
    @Args('id', {
      type:
        /* istanbul ignore next */
        () => ID,
    })
    id: string,
  ): Promise<Book> {
    return this.bookService.getById(new ObjectId(id));
  }

  @Query(
    /* istanbul ignore next */
    () => [Book],
    {nullable: false},
  )
  async allBooks(): Promise<Book[]> {
    return this.bookService.all();
  }

  @ResolveField(
    /* istanbul ignore next */
    () => ID,
  )
  id(@Parent() book: Book): string {
    return this.bookService.id(book).toHexString();
  }

  @ResolveField(
    /* istanbul ignore next */
    () => [BookAuthorsConnection],
  )
  authors(@Parent() book: Book) {
    return book.authors;
  }

  @ResolveField(
    /* istanbul ignore next */
    () => [SeriesEntity],
  )
  async relatedSeries(@Parent() book: Book) {
    return this.bookService.relatedSeries(book);
  }

  @ResolveReference()
  resolveReference(reference: {__typename: string; id: string}) {
    return this.book(reference.id);
  }

  @Mutation(
    /* istanbul ignore next */
    () => Book,
    {nullable: false},
  )
  async createBook(
    @Args('data', {
      type:
        /* istanbul ignore next */
        () => CreateBookInput,
    })
    {authors, ...data}: CreateBookInput,
  ): Promise<Book> {
    return this.bookService.create({
      authors: authors.map(({id, ...rest}) => ({
        id: new ObjectId(id),
        ...rest,
      })),
      ...data,
    });
  }
}

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
import {BookEntity} from './entity/book.entity';
import {BookDocument} from './schema/book.schema';

@Resolver(
  /* istanbul ignore next */
  () => BookEntity,
)
export class BooksResolver {
  constructor(private bookService: BooksService) {}

  @Query(
    /* istanbul ignore next */
    () => BookEntity,
    {nullable: false},
  )
  async book(
    @Args('id', {
      type:
        /* istanbul ignore next */
        () => ID,
    })
    id: string,
  ): Promise<BookDocument> {
    return this.bookService.getById(new ObjectId(id));
  }

  @Query(
    /* istanbul ignore next */
    () => [BookEntity],
    {nullable: false},
  )
  async allBooks(): Promise<BookDocument[]> {
    return this.bookService.all();
  }

  @ResolveField(
    /* istanbul ignore next */
    () => ID,
  )
  id(@Parent() book: BookDocument): string {
    return this.bookService.id(book).toHexString();
  }

  @ResolveField(
    /* istanbul ignore next */
    () => [BookAuthorsConnection],
  )
  authors(@Parent() book: BookDocument) {
    return book.authors;
  }

  @ResolveField(
    /* istanbul ignore next */
    () => [SeriesEntity],
  )
  async relatedSeries(@Parent() book: BookDocument) {
    return this.bookService.relatedSeries(book);
  }

  @ResolveReference()
  resolveReference(reference: {__typename: string; id: string}) {
    return this.book(reference.id);
  }

  @Mutation(
    /* istanbul ignore next */
    () => BookEntity,
    {nullable: false},
  )
  async createBook(
    @Args('data', {
      type:
        /* istanbul ignore next */
        () => CreateBookInput,
    })
    {authors, ...data}: CreateBookInput,
  ): Promise<BookDocument> {
    return this.bookService.create({
      authors: authors.map(({id, ...rest}) => ({
        id: new ObjectId(id),
        ...rest,
      })),
      ...data,
    });
  }
}

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
import {BooksService} from './books.service';
import {CreateBookInput} from './dto/create-book.input';
import {Book} from './schema/book.schema';

@Resolver(() => Book)
export class BooksResolver {
  constructor(private bookService: BooksService) {}

  @Query(() => Book, {nullable: false})
  async book(
    @Args('id', {type: () => ID})
    id: string,
  ): Promise<Book> {
    return this.bookService.getById(new ObjectId(id));
  }

  @Query(() => [Book], {nullable: false})
  async allBooks(): Promise<Book[]> {
    return this.bookService.all();
  }

  @ResolveField(() => ID)
  id(@Parent() book: Book): ObjectId {
    return this.bookService.id(book);
  }

  @ResolveField(() => [BookAuthorsConnection])
  async authors(@Parent() book: Book) {
    return book.authors;
  }

  @ResolveReference()
  resolveReference(reference: {__typename: string; id: string}) {
    return this.book(reference.id);
  }

  @Mutation(() => Book, {nullable: false})
  async createBook(
    @Args('data', {type: () => CreateBookInput})
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

import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {BooksService} from './books.service';
import {BookAuthorConnection} from './connection/author.connection';
import {CreateBookInput} from './dto/create-book.input';
import {Book} from './schema/book.schema';

@Resolver(() => Book)
export class BooksResolver {
  constructor(private bookService: BooksService) {}

  @Query(() => Book, {nullable: false})
  async book(@Args('id', {type: () => ID}) id: string): Promise<Book> {
    return this.bookService.getById(id);
  }

  @ResolveField(() => ID)
  id(@Parent() book: Book): string {
    return this.bookService.id(book);
  }

  @ResolveField(() => [BookAuthorConnection])
  async authors(@Parent() book: Book): Promise<BookAuthorConnection[]> {
    return [];
  }

  @Mutation(() => Book, {nullable: false})
  async createBook(
    @Args('data', {type: () => CreateBookInput})
    data: CreateBookInput,
  ): Promise<Book> {
    return this.bookService.create(data);
  }
}

import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {AuthorBookConnection} from '../authors/connection/book.connection';
import {BooksService} from './books.service';
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

  @ResolveField(() => [AuthorBookConnection])
  async authors(@Parent() book: Book) {
    return book.authors;
  }

  @Mutation(() => Book, {nullable: false})
  async createBook(
    @Args('data', {type: () => CreateBookInput})
    data: CreateBookInput,
  ): Promise<Book> {
    return this.bookService.create(data);
  }
}

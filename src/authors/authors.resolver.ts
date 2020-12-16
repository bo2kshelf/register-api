import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {PaginatedBookConnection} from '../books/connection/paginated.connection';
import {AuthorsService} from './authors.service';
import {CreateAuthorInput} from './dto/create-author.input';
import {AuthorResolveBooksArgsType} from './dto/resolve-books.argstype';
import {Author} from './schema/author.schema';

@Resolver(() => Author)
export class AuthorsResolver {
  constructor(private authorsService: AuthorsService) {}

  @Query(() => Author, {nullable: false})
  async author(@Args('id', {type: () => ID}) id: string): Promise<Author> {
    return this.authorsService.getById(id);
  }

  @ResolveField(() => ID)
  id(@Parent() author: Author): string {
    return this.authorsService.id(author);
  }

  @ResolveField(() => PaginatedBookConnection)
  async books(
    @Parent() author: Author,

    @Args({type: () => AuthorResolveBooksArgsType})
    args: AuthorResolveBooksArgsType,
  ) {
    return this.authorsService.books(author, args);
  }

  @Mutation(() => Author, {nullable: false})
  async createAuthor(
    @Args('data', {type: () => CreateAuthorInput})
    data: CreateAuthorInput,
  ): Promise<Author> {
    return this.authorsService.create(data);
  }
}

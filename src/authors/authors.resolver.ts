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
import {PaginatedBookConnection} from '../books/connection/paginated.connection';
import {AuthorsService} from './authors.service';
import {AuthorBooksArgs} from './dto/books.args';
import {CreateAuthorInput} from './dto/create-author.input';
import {Author} from './schema/author.schema';

@Resolver(() => Author)
export class AuthorsResolver {
  constructor(private authorsService: AuthorsService) {}

  @Query(() => Author, {nullable: false})
  async author(
    @Args('id', {type: () => ID})
    id: string,
  ): Promise<Author> {
    return this.authorsService.getById(new ObjectId(id));
  }

  @ResolveField(() => ID)
  id(@Parent() author: Author) {
    return this.authorsService.id(author);
  }

  @ResolveField(() => PaginatedBookConnection)
  async books(
    @Parent() author: Author,

    @Args({type: () => AuthorBooksArgs})
    args: AuthorBooksArgs,
  ) {
    return this.authorsService.books(author, args);
  }

  @ResolveReference()
  resolveReference(reference: {__typename: string; id: string}) {
    return this.author(reference.id);
  }

  @Mutation(() => Author, {nullable: false})
  async createAuthor(
    @Args('data', {type: () => CreateAuthorInput})
    data: CreateAuthorInput,
  ): Promise<Author> {
    return this.authorsService.create(data);
  }
}

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
import {CreateAuthorInput} from './dto/create-author.input';
import {AuthorResolveBooksArgs} from './dto/resolve-books.args';
import {Author} from './schema/author.schema';

@Resolver(() => Author)
export class AuthorsResolver {
  constructor(private authorsService: AuthorsService) {}

  @Query(() => Author, {nullable: false})
  async author(@Args('id', {type: () => ID}) id: ObjectId): Promise<Author> {
    return this.authorsService.getById(id);
  }

  @ResolveField(() => ID)
  id(@Parent() author: Author): ObjectId {
    return this.authorsService.id(author);
  }

  @ResolveField(() => PaginatedBookConnection)
  async books(
    @Parent() author: Author,

    @Args({type: () => AuthorResolveBooksArgs})
    args: AuthorResolveBooksArgs,
  ) {
    return this.authorsService.books(author, args);
  }

  @ResolveReference()
  resolveReference(reference: {__typename: string; id: ObjectId}) {
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

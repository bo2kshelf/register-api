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

@Resolver(
  /* istanbul ignore next */
  () => Author,
)
export class AuthorsResolver {
  constructor(private authorsService: AuthorsService) {}

  @Query(
    /* istanbul ignore next */
    () => Author,
    {nullable: false},
  )
  async author(
    @Args('id', {
      type:
        /* istanbul ignore next */
        () => ID,
    })
    id: string,
  ): Promise<Author> {
    return this.authorsService.getById(new ObjectId(id));
  }

  @Query(
    /* istanbul ignore next */
    () => [Author],
    {nullable: false},
  )
  async allAuthors(): Promise<Author[]> {
    return this.authorsService.all();
  }

  @ResolveField(
    /* istanbul ignore next */
    () => ID,
  )
  id(@Parent() author: Author): string {
    return this.authorsService.id(author).toHexString();
  }

  @ResolveField(
    /* istanbul ignore next */
    () => PaginatedBookConnection,
  )
  async books(
    @Parent() author: Author,

    @Args({
      type:
        /* istanbul ignore next */
        () => AuthorBooksArgs,
    })
    args: AuthorBooksArgs,
  ) {
    return this.authorsService.books(author, args);
  }

  @ResolveReference()
  resolveReference(reference: {__typename: string; id: string}) {
    return this.author(reference.id);
  }

  @Mutation(
    /* istanbul ignore next */
    () => Author,
    {nullable: false},
  )
  async createAuthor(
    @Args('data', {
      type:
        /* istanbul ignore next */
        () => CreateAuthorInput,
    })
    data: CreateAuthorInput,
  ): Promise<Author> {
    return this.authorsService.create(data);
  }
}

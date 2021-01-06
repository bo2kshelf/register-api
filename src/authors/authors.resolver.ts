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
import {RelayConnection} from '../paginate/paginate.service';
import {PaginatedSeriesConnection} from '../series/connection/paginated.connection';
import {SeriesDocument} from '../series/schema/series.schema';
import {AuthorsService} from './authors.service';
import {AuthorBooksArgs} from './dto/books.args';
import {CreateAuthorInput} from './dto/create-author.input';
import {AuthorRelatedSeriesArgs} from './dto/related-series.args';
import {AuthorEntity} from './entity/author.entity';
import {AuthorDocument} from './schema/author.schema';

@Resolver(
  /* istanbul ignore next */
  () => AuthorEntity,
)
export class AuthorsResolver {
  constructor(private authorsService: AuthorsService) {}

  @Query(
    /* istanbul ignore next */
    () => AuthorEntity,
    {nullable: false},
  )
  async author(
    @Args('id', {
      type:
        /* istanbul ignore next */
        () => ID,
    })
    id: string,
  ): Promise<AuthorDocument> {
    return this.authorsService.getById(new ObjectId(id));
  }

  @Query(
    /* istanbul ignore next */
    () => [AuthorEntity],
    {nullable: false},
  )
  async allAuthors(): Promise<AuthorDocument[]> {
    return this.authorsService.all();
  }

  @ResolveField(
    /* istanbul ignore next */
    () => ID,
  )
  id(@Parent() author: AuthorDocument): string {
    return this.authorsService.id(author).toHexString();
  }

  @ResolveField(
    /* istanbul ignore next */
    () => PaginatedBookConnection,
  )
  async books(
    @Parent() author: AuthorDocument,

    @Args({
      type:
        /* istanbul ignore next */
        () => AuthorBooksArgs,
    })
    args: AuthorBooksArgs,
  ) {
    return this.authorsService.books(author, args);
  }

  @ResolveField(
    /* istanbul ignore next */
    () => PaginatedSeriesConnection,
  )
  async relatedSeries(
    @Parent() author: AuthorDocument,
    @Args({
      type:
        /* istanbul ignore next */
        () => AuthorRelatedSeriesArgs,
    })
    args: AuthorRelatedSeriesArgs,
  ): Promise<RelayConnection<SeriesDocument>> {
    return this.authorsService.relatedSeries(author, args);
  }

  @ResolveReference()
  resolveReference(reference: {__typename: string; id: string}) {
    return this.author(reference.id);
  }

  @Mutation(
    /* istanbul ignore next */
    () => AuthorEntity,
    {nullable: false},
  )
  async createAuthor(
    @Args('data', {
      type:
        /* istanbul ignore next */
        () => CreateAuthorInput,
    })
    data: CreateAuthorInput,
  ): Promise<AuthorDocument> {
    return this.authorsService.create(data);
  }
}

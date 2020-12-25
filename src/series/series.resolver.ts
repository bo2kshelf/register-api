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
import {
  PaginatedBookSeriesConnection,
  PaginatedBookSeriesRelatedBookConnection,
} from '../books/connection/series.connection';
import {AddBookToSeriesBooksArgs} from './dto/add-book-to-series-books.args';
import {AddBookToSeriesRelatedBooksArgs} from './dto/add-book-to-series-related-books.args';
import {CreateSeriesInput} from './dto/create-series.input';
import {SeriesResolveBooksArgsType} from './dto/resolve-books.argstype';
import {SeriesResolveRelatedBooksArgsType} from './dto/resolve-related-books.argstype';
import {Series} from './schema/series.schema';
import {SeriesService} from './series.service';

@Resolver(() => Series)
export class SeriesResolver {
  constructor(private seriesService: SeriesService) {}

  @Query(() => Series, {nullable: false})
  async series(@Args('id', {type: () => ID}) id: ObjectId): Promise<Series> {
    return this.seriesService.getById(id);
  }

  @ResolveField(() => ID)
  id(@Parent() series: Series): ObjectId {
    return this.seriesService.id(series);
  }

  @ResolveField(() => PaginatedBookSeriesConnection)
  async books(
    @Parent() series: Series,

    @Args({type: () => SeriesResolveBooksArgsType})
    {orderBy, ...args}: SeriesResolveBooksArgsType,
  ) {
    return this.seriesService.books(series, args, orderBy);
  }

  @ResolveField(() => PaginatedBookSeriesRelatedBookConnection)
  async relatedBooks(
    @Parent() series: Series,

    @Args({type: () => SeriesResolveBooksArgsType})
    args: SeriesResolveRelatedBooksArgsType,
  ) {
    return this.seriesService.relatedBooks(series, args);
  }

  @ResolveReference()
  resolveReference(reference: {__typename: string; id: ObjectId}) {
    return this.series(reference.id);
  }

  @Mutation(() => Series, {nullable: false})
  async createSeries(
    @Args('data', {type: () => CreateSeriesInput})
    data: CreateSeriesInput,
  ): Promise<Series> {
    return this.seriesService.create(data);
  }

  @Mutation(() => Series, {nullable: false})
  async addBookToSeriesBooks(
    @Args({type: () => AddBookToSeriesBooksArgs})
    {seriesId, bookId, serial}: AddBookToSeriesBooksArgs,
  ): Promise<Series> {
    return this.seriesService.addBookToBooks(seriesId, bookId, serial);
  }

  @Mutation(() => Series, {nullable: false})
  async addBookToSeriesRelatedBooks(
    @Args({type: () => AddBookToSeriesRelatedBooksArgs})
    {seriesId, bookId}: AddBookToSeriesRelatedBooksArgs,
  ): Promise<Series> {
    return this.seriesService.addBookToRelatedBooks(seriesId, bookId);
  }
}

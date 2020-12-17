import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {ObjectId} from 'mongodb';
import {
  PaginatedBookSeriesConnection,
  PaginatedBookSeriesRelatedBookConnection,
} from '../books/connection/series.connection';
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
    args: SeriesResolveBooksArgsType,
  ) {
    return this.seriesService.books(series, args);
  }

  @ResolveField(() => PaginatedBookSeriesRelatedBookConnection)
  async relatedBooks(
    @Parent() series: Series,

    @Args({type: () => SeriesResolveBooksArgsType})
    args: SeriesResolveRelatedBooksArgsType,
  ) {
    return this.seriesService.relatedBooks(series, args);
  }

  @Mutation(() => Series, {nullable: false})
  async createSeries(
    @Args('data', {type: () => CreateSeriesInput})
    data: CreateSeriesInput,
  ): Promise<Series> {
    return this.seriesService.create(data);
  }
}

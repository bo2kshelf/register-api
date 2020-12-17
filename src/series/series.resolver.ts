import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {ObjectId} from 'mongodb';
import {BookSeriesConnection} from '../books/connection/series.connection';
import {CreateSeriesInput} from './dto/create-series.input';
import {Series} from './schema/series.schema';
import {SeriesService} from './series.service';

@Resolver(() => Series)
export class SeriesResolver {
  constructor(private seriesService: SeriesService) {}

  @Query(() => Series, {nullable: false})
  async series(
    @Args('id', {type: () => ObjectId}) id: ObjectId,
  ): Promise<Series> {
    return this.seriesService.getById(id);
  }

  @ResolveField(() => ObjectId)
  id(@Parent() series: Series): ObjectId {
    return this.seriesService.id(series);
  }

  @ResolveField(() => [BookSeriesConnection])
  async books(@Parent() series: Series) {
    return series.books;
  }

  @Mutation(() => Series, {nullable: false})
  async createSeries(
    @Args('data', {type: () => CreateSeriesInput})
    data: CreateSeriesInput,
  ): Promise<Series> {
    return this.seriesService.create(data);
  }
}

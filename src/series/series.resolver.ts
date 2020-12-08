import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {BookSeriesConnection} from '../books/connection/series.connection';
import {CreateSeriesInput} from './dto/create-series.input';
import {Series} from './schema/series.schema';
import {SeriesService} from './series.service';

@Resolver(() => Series)
export class SeriesResolver {
  constructor(private seriesService: SeriesService) {}

  @Query(() => Series, {nullable: false})
  async series(@Args('id', {type: () => ID}) id: string): Promise<Series> {
    return this.seriesService.getById(id);
  }

  @ResolveField(() => ID)
  id(@Parent() series: Series): string {
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

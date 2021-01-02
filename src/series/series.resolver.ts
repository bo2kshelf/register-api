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
  PaginatedSeriesBooksConnection,
  PaginatedSeriesRelatedBooksConnection,
} from '../books/connection/series-connection.entity';
import {AddBookToSeriesBooksArgs} from './dto/add-book-to-series-books.args';
import {AddBookToSeriesRelatedBooksArgs} from './dto/add-book-to-series-related-books.args';
import {SeriesBooksArgs} from './dto/books.args';
import {CreateSeriesInput} from './dto/create-series.input';
import {SeriesRelatedBooksArgs} from './dto/related-books.args';
import {Series} from './schema/series.schema';
import {SeriesService} from './series.service';

@Resolver(
  /* istanbul ignore next */
  () => Series,
)
export class SeriesResolver {
  constructor(private seriesService: SeriesService) {}

  @Query(
    /* istanbul ignore next */
    () => Series,
    {nullable: false},
  )
  async series(
    @Args('id', {
      type:
        /* istanbul ignore next */
        () => ID,
    })
    id: string,
  ): Promise<Series> {
    return this.seriesService.getById(new ObjectId(id));
  }

  @Query(
    /* istanbul ignore next */
    () => [Series],
    {nullable: false},
  )
  async allSeries(): Promise<Series[]> {
    return this.seriesService.all();
  }

  @ResolveField(
    /* istanbul ignore next */
    () => ID,
  )
  id(@Parent() series: Series): string {
    return this.seriesService.id(series).toHexString();
  }

  @ResolveField(
    /* istanbul ignore next */
    () => PaginatedSeriesBooksConnection,
  )
  async books(
    @Parent() series: Series,

    @Args({
      type:
        /* istanbul ignore next */
        () => SeriesBooksArgs,
    })
    {orderBy, ...args}: SeriesBooksArgs,
  ) {
    return this.seriesService.books(series, args, orderBy);
  }

  @ResolveField(
    /* istanbul ignore next */
    () => PaginatedSeriesRelatedBooksConnection,
  )
  async relatedBooks(
    @Parent() series: Series,

    @Args({
      type:
        /* istanbul ignore next */
        () => SeriesRelatedBooksArgs,
    })
    args: SeriesRelatedBooksArgs,
  ) {
    return this.seriesService.relatedBooks(series, args);
  }

  @ResolveReference()
  resolveReference(reference: {__typename: string; id: string}) {
    return this.series(reference.id);
  }

  @Mutation(
    /* istanbul ignore next */
    () => Series,
    {nullable: false},
  )
  async createSeries(
    @Args('data', {
      type:
        /* istanbul ignore next */
        () => CreateSeriesInput,
    })
    {books, relatedBooks, ...data}: CreateSeriesInput,
  ): Promise<Series> {
    return this.seriesService.create({
      books: books?.map(({id, ...rest}) => ({
        id: new ObjectId(id),
        ...rest,
      })),
      relatedBooks: relatedBooks?.map(({id, ...rest}) => ({
        id: new ObjectId(id),
        ...rest,
      })),
      ...data,
    });
  }

  @Mutation(
    /* istanbul ignore next */
    () => Series,
    {nullable: false},
  )
  async addBookToSeriesBooks(
    @Args({
      type:
        /* istanbul ignore next */
        () => AddBookToSeriesBooksArgs,
    })
    {seriesId, bookId, serial}: AddBookToSeriesBooksArgs,
  ): Promise<Series> {
    return this.seriesService.addBookToBooks(
      new ObjectId(seriesId),
      new ObjectId(bookId),
      serial,
    );
  }

  @Mutation(
    /* istanbul ignore next */
    () => Series,
    {nullable: false},
  )
  async addBookToSeriesRelatedBooks(
    @Args({
      type:
        /* istanbul ignore next */
        () => AddBookToSeriesRelatedBooksArgs,
    })
    {seriesId, bookId}: AddBookToSeriesRelatedBooksArgs,
  ): Promise<Series> {
    return this.seriesService.addBookToRelatedBooks(
      new ObjectId(seriesId),
      new ObjectId(bookId),
    );
  }
}

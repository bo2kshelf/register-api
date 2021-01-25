import {Field, ObjectType} from '@nestjs/graphql';
import {ObjectId} from 'mongodb';
import {PaginatedFactory} from '../../paginate/paginated.factory';

@ObjectType()
export class SeriesBooksConnection {
  id!: ObjectId;

  @Field(() => Number)
  serial!: number;
}

@ObjectType()
export class SeriesRelatedBooksConnection {
  id!: ObjectId;
}

@ObjectType()
export class PaginatedSeriesBooksConnection extends PaginatedFactory(
  SeriesBooksConnection,
) {}

@ObjectType()
export class PaginatedSeriesRelatedBooksConnection extends PaginatedFactory(
  SeriesRelatedBooksConnection,
) {}

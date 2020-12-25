import {Field, ID, ObjectType} from '@nestjs/graphql';
import {ObjectId} from 'mongodb';
import {PaginatedFactory} from '../../paginate/paginated.factory';

@ObjectType()
export class BookSeriesConnection {
  @Field(() => ID)
  id!: ObjectId;

  @Field(() => Number)
  serial!: number;
}

@ObjectType()
export class BookSeriesRelatedBookConnection {
  @Field(() => ID)
  id!: ObjectId;
}

@ObjectType()
export class PaginatedBookSeriesConnection extends PaginatedFactory(
  BookSeriesConnection,
) {}

@ObjectType()
export class PaginatedBookSeriesRelatedBookConnection extends PaginatedFactory(
  BookSeriesRelatedBookConnection,
) {}

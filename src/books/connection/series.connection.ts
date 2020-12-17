import {Field, ID, ObjectType} from '@nestjs/graphql';
import {ObjectId} from 'mongodb';
import {Paginated} from '../../paginate/paginate';

@ObjectType()
export class BookSeriesConnection {
  @Field(() => ID)
  id!: ObjectId;

  @Field(() => Number)
  serial!: number;
}

@ObjectType()
export class PaginatedBookSeriesConnection extends Paginated(
  BookSeriesConnection,
) {}

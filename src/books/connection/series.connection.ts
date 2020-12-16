import {Field, ID, ObjectType} from '@nestjs/graphql';
import {ObjectId} from 'mongodb';

@ObjectType()
export class BookSeriesConnection {
  @Field(() => ID)
  id!: ObjectId;

  @Field(() => Number)
  serial!: number;
}

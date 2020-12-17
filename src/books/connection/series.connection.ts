import {Field, ObjectType} from '@nestjs/graphql';
import {ObjectId} from 'mongodb';

@ObjectType()
export class BookSeriesConnection {
  @Field(() => ObjectId)
  id!: ObjectId;

  @Field(() => Number)
  serial!: number;
}

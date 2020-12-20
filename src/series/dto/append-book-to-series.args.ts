import {ArgsType, Field} from '@nestjs/graphql';
import {IsPositive} from 'class-validator';
import {ObjectId} from 'mongodb';

@ArgsType()
export class AppendBookToSeriesArgs {
  @Field(() => ObjectId)
  seriesId!: ObjectId;

  @Field(() => ObjectId)
  bookId!: ObjectId;

  @Field()
  @IsPositive()
  serial!: number;
}

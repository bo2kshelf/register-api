import {ArgsType, Field} from '@nestjs/graphql';
import {IsPositive} from 'class-validator';
import {ObjectId} from 'mongodb';

@ArgsType()
export class AddBookToSeriesBooksArgs {
  @Field(() => ObjectId)
  seriesId!: ObjectId;

  @Field(() => ObjectId)
  bookId!: ObjectId;

  @Field()
  @IsPositive()
  serial!: number;
}

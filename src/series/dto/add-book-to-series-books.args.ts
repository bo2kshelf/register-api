import {ArgsType, Field, ID} from '@nestjs/graphql';
import {IsPositive} from 'class-validator';
import {ObjectId} from 'mongodb';

@ArgsType()
export class AddBookToSeriesBooksArgs {
  @Field(() => ID)
  seriesId!: ObjectId;

  @Field(() => ID)
  bookId!: ObjectId;

  @Field()
  @IsPositive()
  serial!: number;
}

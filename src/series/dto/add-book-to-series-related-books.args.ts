import {ArgsType, Field, ID} from '@nestjs/graphql';
import {ObjectId} from 'mongodb';

@ArgsType()
export class AddBookToSeriesRelatedBooksArgs {
  @Field(() => ID)
  seriesId!: ObjectId;

  @Field(() => ID)
  bookId!: ObjectId;
}

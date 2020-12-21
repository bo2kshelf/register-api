import {ArgsType, Field} from '@nestjs/graphql';
import {ObjectId} from 'mongodb';

@ArgsType()
export class AddBookToSeriesRelatedBooksArgs {
  @Field(() => ObjectId)
  seriesId!: ObjectId;

  @Field(() => ObjectId)
  bookId!: ObjectId;
}

import {ArgsType, Field, ID} from '@nestjs/graphql';

@ArgsType()
export class AddBookToSeriesRelatedBooksArgs {
  @Field(() => ID)
  seriesId!: string;

  @Field(() => ID)
  bookId!: string;
}

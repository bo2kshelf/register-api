import {Field, ID, InputType} from '@nestjs/graphql';

@InputType()
export class AddBookToSeriesRelatedBooksInput {
  @Field(() => ID)
  seriesId!: string;

  @Field(() => ID)
  bookId!: string;
}

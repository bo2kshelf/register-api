import {ArgsType, Field, ID} from '@nestjs/graphql';
import {IsPositive} from 'class-validator';

@ArgsType()
export class AddBookToSeriesBooksArgs {
  @Field(() => ID)
  seriesId!: string;

  @Field(() => ID)
  bookId!: string;

  @Field()
  @IsPositive()
  serial!: number;
}

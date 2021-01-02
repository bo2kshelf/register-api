import {Field, ID, InputType} from '@nestjs/graphql';
import {IsPositive} from 'class-validator';

@InputType()
export class AddBookToSeriesBooksInput {
  @Field(() => ID)
  seriesId!: string;

  @Field(() => ID)
  bookId!: string;

  @Field()
  @IsPositive()
  serial!: number;
}

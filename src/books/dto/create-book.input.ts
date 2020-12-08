import {Field, InputType} from '@nestjs/graphql';
import {AuthorBookConnectionInput} from '../../authors/connection/book.connection';

@InputType()
export class CreateBookInput {
  @Field()
  title!: string;

  @Field({nullable: true})
  isbn?: string;

  @Field(() => [AuthorBookConnectionInput])
  authors!: {
    id: string;
    roles?: string[];
  }[];
}

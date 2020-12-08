import {Field, InputType} from '@nestjs/graphql';
import {BookAuthorConnectionInput} from '../connection/author.connection';

@InputType()
export class CreateBookInput {
  @Field()
  title!: string;

  @Field({nullable: true})
  isbn?: string;

  @Field(() => [BookAuthorConnectionInput])
  authors!: {
    id: string;
    roles?: string[];
  }[];
}

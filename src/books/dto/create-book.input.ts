import {Field, ID, InputType} from '@nestjs/graphql';

@InputType()
export class CreateBookInput {
  @Field()
  title!: string;

  @Field({nullable: true})
  isbn?: string;

  @Field(() => [CreateBookAuthorsInput])
  authors!: CreateBookAuthorsInput[];
}

@InputType()
export class CreateBookAuthorsInput {
  @Field(() => ID)
  id!: string;

  @Field(() => [String], {nullable: true})
  roles?: string[];
}

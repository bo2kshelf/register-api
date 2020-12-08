import {Field, InputType} from '@nestjs/graphql';

@InputType()
export class CreateBookInput {
  @Field()
  title!: string;

  @Field({nullable: true})
  isbn?: string;

  @Field(() => [CreateBookAuthorsInput])
  authors!: {
    id: string;
    roles?: string[];
  }[];
}

@InputType()
export class CreateBookAuthorsInput {
  @Field(() => String)
  id!: string;

  @Field(() => [String], {nullable: true})
  roles?: string[];
}

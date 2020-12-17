import {Field, InputType} from '@nestjs/graphql';
import {ObjectId} from 'mongodb';

@InputType()
export class CreateBookInput {
  @Field()
  title!: string;

  @Field({nullable: true})
  isbn?: string;

  @Field(() => [CreateBookAuthorsInput])
  authors!: {
    id: ObjectId;
    roles?: string[];
  }[];
}

@InputType()
export class CreateBookAuthorsInput {
  @Field(() => ObjectId)
  id!: ObjectId;

  @Field(() => [String], {nullable: true})
  roles?: string[];
}

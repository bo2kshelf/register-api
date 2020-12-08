import {Field, InputType, ObjectType} from '@nestjs/graphql';

@ObjectType()
export class AuthorBookConnection {
  @Field(() => String)
  id!: string;

  @Field(() => [String], {nullable: true})
  roles?: string[];
}

@InputType()
export class AuthorBookConnectionInput {
  @Field(() => String)
  id!: string;

  @Field(() => [String], {nullable: true})
  roles?: string[];
}

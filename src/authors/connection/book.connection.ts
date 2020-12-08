import {Field, ObjectType} from '@nestjs/graphql';

@ObjectType()
export class AuthorBookConnection {
  @Field(() => String)
  id!: string;

  @Field(() => [String], {nullable: true})
  roles?: string[];
}

import {Field, InputType, ObjectType, Resolver} from '@nestjs/graphql';

@ObjectType()
export class BookAuthorConnection {
  @Field(() => String)
  id!: string;

  @Field(() => [String], {nullable: true})
  roles?: string[];
}

@InputType()
export class BookAuthorConnectionInput {
  @Field(() => String)
  id!: string;

  @Field(() => [String], {nullable: true})
  roles?: string[];
}

@Resolver(() => BookAuthorConnection)
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class BookAuthorConnectionResolver {}

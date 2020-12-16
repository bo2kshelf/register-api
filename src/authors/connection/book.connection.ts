import {Field, ID, ObjectType} from '@nestjs/graphql';
import {ObjectId} from 'mongodb';

@ObjectType()
export class AuthorBookConnection {
  @Field(() => ID)
  id!: ObjectId;

  @Field(() => [String], {nullable: true})
  roles?: string[];
}

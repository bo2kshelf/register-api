import {Field, ObjectType} from '@nestjs/graphql';
import {ObjectId} from 'mongodb';

@ObjectType()
export class AuthorBookConnection {
  @Field(() => ObjectId)
  id!: ObjectId;

  @Field(() => [String], {nullable: true})
  roles?: string[];
}

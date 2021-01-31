import {Field, ObjectType} from '@nestjs/graphql';
import {ObjectId} from 'mongodb';

@ObjectType()
export class BookAuthorsConnection {
  id!: ObjectId;

  @Field(() => [String], {nullable: true})
  roles?: string[];
}

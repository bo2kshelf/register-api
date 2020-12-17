import {Field, ID, InputType} from '@nestjs/graphql';
import {ObjectId} from 'mongodb';

@InputType()
export class CreateSeriesInput {
  @Field()
  title!: string;

  @Field(() => [CreateSeriesBooksInput])
  books!: CreateSeriesBooksInput[];

  @Field(() => [ID], {nullable: true})
  relatedBooks?: ObjectId[];
}

@InputType()
export class CreateSeriesBooksInput {
  @Field(() => ObjectId)
  id!: ObjectId;

  @Field()
  serial!: number;
}

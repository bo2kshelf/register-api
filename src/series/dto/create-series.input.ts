import {Field, ID, InputType} from '@nestjs/graphql';
import {ObjectId} from 'mongodb';

@InputType()
export class CreateSeriesInput {
  @Field()
  title!: string;

  @Field(() => [CreateSeriesBooksInput])
  books!: CreateSeriesBooksInput[];

  @Field(() => [CreateSeriesRelatedBooksInput], {nullable: true})
  relatedBooks?: CreateSeriesRelatedBooksInput[];
}

@InputType()
export class CreateSeriesBooksInput {
  @Field(() => ObjectId)
  id!: ObjectId;

  @Field()
  serial!: number;
}

@InputType()
export class CreateSeriesRelatedBooksInput {
  @Field(() => ID)
  id!: ObjectId;
}

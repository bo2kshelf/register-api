import {Field, ID, InputType} from '@nestjs/graphql';

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
  @Field(() => ID)
  id!: string;

  @Field()
  serial!: number;
}

@InputType()
export class CreateSeriesRelatedBooksInput {
  @Field(() => ID)
  id!: string;
}

import {Field, InputType} from '@nestjs/graphql';

@InputType()
export class CreateSeriesInput {
  @Field()
  title!: string;

  @Field(() => [CreateSeriesBooksInput])
  books!: CreateSeriesBooksInput[];

  @Field(() => [String], {nullable: true})
  relatedBooks?: string[];
}

@InputType()
export class CreateSeriesBooksInput {
  @Field(() => String)
  id!: string;

  @Field()
  serial!: number;
}

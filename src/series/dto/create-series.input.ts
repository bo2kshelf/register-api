import {Field, InputType} from '@nestjs/graphql';

@InputType()
export class CreateSeriesInput {
  @Field()
  title!: string;

  @Field(() => [String], {nullable: true})
  relatedBooks?: string[];
}

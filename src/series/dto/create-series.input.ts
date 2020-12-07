import {Field, InputType} from '@nestjs/graphql';

@InputType()
export class CreateSeriesInput {
  @Field()
  title!: string;
}

import {Field, ObjectType} from '@nestjs/graphql';

@ObjectType()
export class BookSeriesConnection {
  @Field(() => String)
  id!: string;

  @Field(() => Number)
  serial!: number;
}

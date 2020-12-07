import {Field, InputType} from '@nestjs/graphql';

@InputType()
export class CreateBookInput {
  @Field()
  title!: string;

  @Field({nullable: true})
  isbn?: string;
}

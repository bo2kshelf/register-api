import {Directive, Field, ObjectType} from '@nestjs/graphql';

@ObjectType('Book')
@Directive('@key(fields: "id")')
export class BookEntity {
  @Field(() => String)
  title!: string;

  @Field(() => String, {nullable: true})
  isbn?: string;
}

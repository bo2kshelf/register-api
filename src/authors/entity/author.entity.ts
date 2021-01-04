import {Directive, Field, ObjectType} from '@nestjs/graphql';

@ObjectType('Author')
@Directive('@key(fields: "id")')
export class AuthorEntity {
  @Field(() => String)
  name!: string;
}

import {Directive, Field, ObjectType} from '@nestjs/graphql';

@ObjectType('Series')
@Directive('@key(fields: "id")')
export class SeriesEntity {
  @Field(() => String)
  title!: string;
}

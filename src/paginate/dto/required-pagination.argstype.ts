import {ArgsType, Field, Int} from '@nestjs/graphql';
import {Min} from 'class-validator';
import * as Relay from 'graphql-relay';

@ArgsType()
export class RequiredPaginationArgs implements Relay.ConnectionArguments {
  @Field((_type) => String, {
    nullable: true,
  })
  before?: Relay.ConnectionCursor;

  @Field((_type) => String, {
    nullable: true,
  })
  after?: Relay.ConnectionCursor;

  @Field((_type) => Int, {
    nullable: true,
  })
  @Min(1)
  first?: number;

  @Field((_type) => Int, {
    nullable: true,
  })
  @Min(1)
  last?: number;
}

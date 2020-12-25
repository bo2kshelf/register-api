import {ArgsType, Field, Int} from '@nestjs/graphql';
import {Min, Validate} from 'class-validator';
import * as Relay from 'graphql-relay';
import {CannotUseWith} from '../../validators/cannot-use-with.validator';
import {CannotUseWithout} from '../../validators/cannot-use-without.validator';

@ArgsType()
export class RequiredPaginationArgs implements Relay.ConnectionArguments {
  @Field((_type) => String, {
    nullable: true,
  })
  @Validate(CannotUseWithout, ['first'])
  @Validate(CannotUseWith, ['before', 'last'])
  after?: Relay.ConnectionCursor;

  @Field((_type) => Int, {
    nullable: true,
  })
  @Validate(CannotUseWith, ['before', 'last'])
  @Min(1)
  first?: number;

  @Field((_type) => String, {
    nullable: true,
  })
  @Validate(CannotUseWithout, ['last'])
  @Validate(CannotUseWith, ['after', 'first'])
  before?: Relay.ConnectionCursor;

  @Field((_type) => Int, {
    nullable: true,
  })
  @Validate(CannotUseWithout, ['before'])
  @Validate(CannotUseWith, ['after', 'first'])
  @Min(1)
  last?: number;
}

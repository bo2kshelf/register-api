import {Field, InputType} from '@nestjs/graphql';
import {OrderDirection} from '../enum/order-direction.enum';

@InputType()
export abstract class OrderByDateInput {
  @Field((_type) => OrderDirection, {nullable: true})
  createdAt?: OrderDirection;

  @Field((_type) => OrderDirection, {nullable: true})
  updatedAt?: OrderDirection;
}

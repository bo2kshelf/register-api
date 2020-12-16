import {Field, InputType} from '@nestjs/graphql';
import {OrderByDirection} from '../enum/order-by-direction.enum';

@InputType()
export abstract class OrderByDateInput {
  @Field((_type) => OrderByDirection, {nullable: true})
  createdAt?: OrderByDirection;

  @Field((_type) => OrderByDirection, {nullable: true})
  updatedAt?: OrderByDirection;
}

import {ArgsType, Field, InputType} from '@nestjs/graphql';
import {RequiredPaginationArgs} from '../../paginate/dto/required-pagination.argstype';
import {OrderByDirection} from '../../paginate/enum/order-by-direction.enum';

@InputType('SerialResolveBooksOrder')
export class SerialResolveBooksOrderInput {
  @Field((_type) => OrderByDirection, {nullable: true})
  serial?: OrderByDirection;
}

@ArgsType()
export class SeriesResolveBooksArgsType extends RequiredPaginationArgs {
  @Field((_type) => SerialResolveBooksOrderInput, {nullable: true})
  orderBy?: SerialResolveBooksOrderInput;
}

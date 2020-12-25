import {ArgsType, Field, InputType} from '@nestjs/graphql';
import {RequiredPaginationArgs} from '../../paginate/dto/required-pagination.args';
import {OrderDirection} from '../../paginate/enum/order-direction.enum';

@InputType('SeriesResolveBooksOrder')
export class SeriesResolveBooksOrderInput {
  @Field((_type) => OrderDirection, {nullable: true})
  serial?: OrderDirection;
}

@ArgsType()
export class SeriesResolveBooksArgs extends RequiredPaginationArgs {
  @Field((_type) => SeriesResolveBooksOrderInput, {nullable: true})
  orderBy?: SeriesResolveBooksOrderInput;
}

import {ArgsType, Field, InputType} from '@nestjs/graphql';
import {RequiredPaginationArgs} from '../../paginate/dto/required-pagination.args';
import {OrderDirection} from '../../paginate/enum/order-direction.enum';

@InputType()
export class SeriesBooksOrder {
  @Field((_type) => OrderDirection, {nullable: true})
  serial?: OrderDirection;
}

@ArgsType()
export class SeriesBooksArgs extends RequiredPaginationArgs {
  @Field((_type) => SeriesBooksOrder, {nullable: true})
  orderBy?: SeriesBooksOrder;
}

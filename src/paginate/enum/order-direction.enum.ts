/* eslint-disable @shopify/typescript/prefer-pascal-case-enums */
import {registerEnumType} from '@nestjs/graphql';

export enum OrderDirection {
  ASC = 1,
  DESC = -1,
}

registerEnumType(OrderDirection, {name: 'OrderDirection'});

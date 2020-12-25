/* eslint-disable @shopify/typescript/prefer-pascal-case-enums */
import {registerEnumType} from '@nestjs/graphql';

export enum OrderByDirection {
  ASC = 1,
  DESC = -1,
}

registerEnumType(OrderByDirection, {name: 'OrderByDirection'});

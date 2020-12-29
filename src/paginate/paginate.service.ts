import {Injectable} from '@nestjs/common';
import * as Relay from 'graphql-relay';
import {Document, Model} from 'mongoose';
import {RequiredPaginationArgs} from './dto/required-pagination.args';

export type PagingMeta =
  | {pagingType: 'forward'; after?: string; first: number}
  | {pagingType: 'backward'; before?: string; last: number}
  | {pagingType: 'none'};

export interface RelayConnection<S> {
  aggregate: {
    count: number;
  };
  edges: Relay.Edge<S>[];
  pageInfo: Relay.PageInfo;
}

@Injectable()
export class PaginateService {
  constructor() {}

  getPagingParameters(
    args: RequiredPaginationArgs,
  ): {limit: number; skip: number} | Record<string, never> {
    const {first = 0, last = 0, after, before} = args;

    if (Boolean(first) || Boolean(after)) {
      return {
        limit: first,
        skip: after ? Relay.cursorToOffset(after) + 1 : 0,
      };
    } else if (Boolean(last) || Boolean(before)) {
      const limit = last;
      const skip = Relay.cursorToOffset(before!) - last;

      if (skip < 0) return {limit: Math.max(last + skip, 0), skip: 0};
      else return {skip, limit};
    } else {
      return {};
    }
  }

  async getConnectionFromMongooseModel<T extends Document, S>(
    model: Model<T>,
    connArgs: RequiredPaginationArgs,
    countAggregate: Parameters<Model<T>['aggregate']>[0],
    entitiesAggregate: Parameters<Model<T>['aggregate']>[0],
  ): Promise<RelayConnection<S>> {
    const {limit, skip} = this.getPagingParameters(connArgs);
    const count: number = await model
      .aggregate([...countAggregate, {$count: 'count'}])
      .then((result) => result?.[0]?.count || 0);
    const aggregated =
      count > 0
        ? await model.aggregate(
            [
              ...entitiesAggregate,
              skip && {$skip: skip},
              limit && {$limit: limit},
            ].filter(Boolean),
          )
        : [];

    const connection = Relay.connectionFromArraySlice(aggregated, connArgs, {
      arrayLength: count,
      sliceStart: skip || 0,
    });
    return {
      ...connection,
      aggregate: {count},
    };
  }
}

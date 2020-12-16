import {Type} from '@nestjs/common';
import {Field, Int, ObjectType} from '@nestjs/graphql';
import * as Relay from 'graphql-relay';
import {Document, Model} from 'mongoose';
import {RequiredPaginationArgs} from './dto/required-pagination.argstype';

export function Paginated<T>(classRef: Type<T>): any {
  @ObjectType(`${classRef.name}Aggregate`)
  abstract class Aggregate {
    @Field((_type) => Int)
    count!: number;
  }

  @ObjectType(`${classRef.name}PageInfo`)
  abstract class PageInfo implements Relay.PageInfo {
    @Field((_type) => Boolean, {nullable: true})
    hasNextPage?: boolean | null;

    @Field((_type) => Boolean, {nullable: true})
    hasPreviousPage?: boolean | null;

    @Field((_type) => String, {nullable: true})
    startCursor?: Relay.ConnectionCursor | null;

    @Field((_type) => String, {nullable: true})
    endCursor?: Relay.ConnectionCursor | null;
  }

  @ObjectType(`${classRef.name}EdgeType`)
  abstract class Edge implements Relay.Edge<T> {
    @Field(() => classRef)
    node!: T;

    @Field((_type) => String)
    cursor!: Relay.ConnectionCursor;
  }

  @ObjectType(`${classRef.name}Connection`, {isAbstract: true})
  abstract class Connection implements Relay.Connection<T> {
    @Field(() => Aggregate)
    aggregate!: Aggregate;

    @Field(() => PageInfo)
    pageInfo!: Relay.PageInfo;

    @Field(() => [Edge])
    edges!: Relay.Edge<T>[];
  }

  return Connection;
}

export type PagingMeta =
  | {pagingType: 'forward'; after?: string; first: number}
  | {pagingType: 'backward'; before?: string; last: number}
  | {pagingType: 'none'};

function getMeta(args: RequiredPaginationArgs): PagingMeta {
  const {first = 0, last = 0, after, before} = args;

  if (Boolean(first) || Boolean(after))
    return {pagingType: 'forward', after, first};
  else if (Boolean(last) || Boolean(before))
    return {pagingType: 'forward', after, first};
  else return {pagingType: 'none'};
}

export function getPagingParameters(args: RequiredPaginationArgs) {
  const meta = getMeta(args);

  switch (meta.pagingType) {
    case 'forward': {
      return {
        limit: meta.first,
        offset: meta.after ? Relay.cursorToOffset(meta.after) + 1 : 0,
      };
    }
    case 'backward': {
      const {last, before} = meta;
      let limit = last;
      let offset = Relay.cursorToOffset(before!) - last;

      // Check to see if our before-page is underflowing past the 0th item
      if (offset < 0) {
        // Adjust the limit with the underflow value
        limit = Math.max(last + offset, 0);
        offset = 0;
      }

      return {offset, limit};
    }
    default:
      return {};
  }
}

export async function getConnectionFromMongooseModel<T extends Document>(
  countAggregate: Parameters<Model<T>['aggregate']>[0],
  entitiesAggregate: Parameters<Model<T>['aggregate']>[0],
  connArgs: RequiredPaginationArgs,
  model: Model<T>,
) {
  const {limit, offset: skip} = getPagingParameters(connArgs);
  const count: number = await model
    .aggregate([
      ...countAggregate,
      {
        $count: 'count',
      },
    ])
    .then((result) => result?.[0]?.count || 0);
  const aggregated =
    count > 0
      ? await model.aggregate(
          [
            ...entitiesAggregate,
            skip && {
              $skip: skip,
            },
            limit && {
              $limit: limit,
            },
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

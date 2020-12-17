import {CustomScalar, Scalar} from '@nestjs/graphql';
import {Kind, ValueNode} from 'graphql';
import {ObjectId} from 'mongodb';

@Scalar('ObjectId', (type) => ObjectId)
export class ObjectIdScalar implements CustomScalar<string, ObjectId> {
  description = 'Date custom scalar type';

  parseValue(value: string): ObjectId {
    return new ObjectId(value);
  }

  serialize(value: ObjectId): string {
    return value.toHexString();
  }

  parseLiteral(ast: ValueNode) {
    if (ast.kind === Kind.STRING) {
      return new ObjectId(ast.value);
    }
    return null;
  }
}

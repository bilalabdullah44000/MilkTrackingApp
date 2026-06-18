import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('Decimal')
export class DecimalScalar implements CustomScalar<number, number> {
  description = 'Decimal custom scalar type';

  parseValue(value: unknown): number {
    if (typeof value === 'string') return parseFloat(value);
    if (typeof value === 'number') return value;
    throw new Error('Decimal must be a number or numeric string');
  }

  serialize(value: unknown): number {
    if (typeof value === 'string') return parseFloat(value);
    if (typeof value === 'number') return value;
    throw new Error('Decimal scalar can only serialize number values');
  }

  parseLiteral(ast: ValueNode): number {
    if (ast.kind === Kind.FLOAT || ast.kind === Kind.INT) return parseFloat(ast.value);
    throw new Error('Decimal scalar can only parse numeric values');
  }
}

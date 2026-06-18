import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('Date')
export class DateScalar implements CustomScalar<string, string> {
  description = 'Date custom scalar type (YYYY-MM-DD)';

  parseValue(value: unknown): string {
    if (typeof value !== 'string') throw new Error('Date must be a string');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Date must be in YYYY-MM-DD format');
    return value;
  }

  serialize(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    if (typeof value === 'string') return value.split('T')[0];
    throw new Error('Date scalar can only serialize string or Date values');
  }

  parseLiteral(ast: ValueNode): string {
    if (ast.kind === Kind.STRING) return this.parseValue(ast.value);
    throw new Error('Date scalar can only parse string values');
  }
}

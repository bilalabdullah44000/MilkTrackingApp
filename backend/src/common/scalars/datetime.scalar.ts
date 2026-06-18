import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('DateTime')
export class DateTimeScalar implements CustomScalar<string, string> {
  description = 'DateTime custom scalar type (ISO 8601)';

  parseValue(value: unknown): string {
    if (typeof value !== 'string') throw new Error('DateTime must be a string');
    return new Date(value).toISOString();
  }

  serialize(value: unknown): string {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return new Date(value).toISOString();
    throw new Error('DateTime scalar can only serialize string or Date values');
  }

  parseLiteral(ast: ValueNode): string {
    if (ast.kind === Kind.STRING) return this.parseValue(ast.value);
    throw new Error('DateTime scalar can only parse string values');
  }
}

import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { GqlExceptionFilter, GqlArgumentsHost } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch()
export class GraphqlExceptionFilter implements GqlExceptionFilter {
  catch(exception: unknown, _host: ArgumentsHost) {
    GqlArgumentsHost.create(_host);

    if (exception instanceof GraphQLError) return exception;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse() as any;
      const message = typeof response === 'string' ? response : response.message;

      const code =
        status === 401
          ? 'UNAUTHENTICATED'
          : status === 403
            ? 'FORBIDDEN'
            : status === 400
              ? 'BAD_USER_INPUT'
              : 'INTERNAL_SERVER_ERROR';

      return new GraphQLError(Array.isArray(message) ? message[0] : message, {
        extensions: { code },
      });
    }

    if (exception instanceof Error) {
      return new GraphQLError(exception.message, {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }

    return new GraphQLError('An unexpected error occurred', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
}

import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { CustomersModule } from './modules/customers/customers.module';
import { MilkPurchasesModule } from './modules/milk-purchases/milk-purchases.module';
import { MilkDeliveriesModule } from './modules/milk-deliveries/milk-deliveries.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { BillingModule } from './modules/billing/billing.module';
import { DateScalar } from './common/scalars/date.scalar';
import { DecimalScalar } from './common/scalars/decimal.scalar';
import { DateTimeScalar } from './common/scalars/datetime.scalar';
import { GraphQLError } from 'graphql';
import configuration from './config/configuration';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      context: ({ req, res }: { req: any; res: any }) => ({ req, res }),
      formatError: (formattedError: GraphQLError) => ({
        message: formattedError.message,
        extensions: {
          code: formattedError.extensions?.code || 'INTERNAL_SERVER_ERROR',
        },
        path: formattedError.path,
      }),
    }),
    AuthModule,
    UsersModule,
    VendorsModule,
    CustomersModule,
    MilkPurchasesModule,
    MilkDeliveriesModule,
    DashboardModule,
    BillingModule,
  ],
  providers: [DateScalar, DecimalScalar, DateTimeScalar],
})
export class AppModule {}

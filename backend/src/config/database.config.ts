import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/users/user.entity';
import { Vendor } from '../modules/vendors/vendor.entity';
import { Customer } from '../modules/customers/customer.entity';
import { MilkPurchase } from '../modules/milk-purchases/milk-purchase.entity';
import { MilkDelivery } from '../modules/milk-deliveries/milk-delivery.entity';

export const databaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('database.host'),
  port: configService.get('database.port'),
  username: configService.get('database.username'),
  password: configService.get('database.password'),
  database: configService.get('database.name'),
  entities: [User, Vendor, Customer, MilkPurchase, MilkDelivery],
  synchronize: true,
  logging: configService.get('nodeEnv') === 'development',
  migrations: ['dist/database/migrations/*.js'],
  migrationsRun: false,
});

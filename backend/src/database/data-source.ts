import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../modules/users/user.entity';
import { Vendor } from '../modules/vendors/vendor.entity';
import { Customer } from '../modules/customers/customer.entity';
import { MilkPurchase } from '../modules/milk-purchases/milk-purchase.entity';
import { MilkDelivery } from '../modules/milk-deliveries/milk-delivery.entity';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'milk_user',
  password: process.env.DB_PASSWORD || 'milk_pass',
  database: process.env.DB_NAME || 'milk_db',
  entities: [User, Vendor, Customer, MilkPurchase, MilkDelivery],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});

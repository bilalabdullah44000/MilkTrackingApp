import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as bcrypt from 'bcryptjs';
import { User, Role } from '../../modules/users/user.entity';
import { Vendor } from '../../modules/vendors/vendor.entity';
import { Customer } from '../../modules/customers/customer.entity';
import { MilkPurchase } from '../../modules/milk-purchases/milk-purchase.entity';
import { MilkDelivery } from '../../modules/milk-deliveries/milk-delivery.entity';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'milk_user',
  password: process.env.DB_PASSWORD || 'milk_pass',
  database: process.env.DB_NAME || 'milk_db',
  entities: [User, Vendor, Customer, MilkPurchase, MilkDelivery],
  synchronize: true,
});

async function seed() {
  await dataSource.initialize();
  console.log('Database connected. Starting seed...');

  const userRepo = dataSource.getRepository(User);
  const vendorRepo = dataSource.getRepository(Vendor);
  const customerRepo = dataSource.getRepository(Customer);
  const purchaseRepo = dataSource.getRepository(MilkPurchase);
  const deliveryRepo = dataSource.getRepository(MilkDelivery);

  await dataSource.query('TRUNCATE TABLE milk_deliveries, milk_purchases, customers, vendors, users CASCADE');

  const ownerHash = await bcrypt.hash('Owner@1234', 12);
  const workerHash = await bcrypt.hash('Worker@1234', 12);

  const owner = await userRepo.save({
    fullName: 'Muhammad Ali Khan',
    email: 'owner@milkdairy.com',
    passwordHash: ownerHash,
    role: Role.OWNER,
    active: true,
  });

  const worker = await userRepo.save({
    fullName: 'Ahmed Hassan',
    email: 'worker@milkdairy.com',
    passwordHash: workerHash,
    role: Role.WORKER,
    active: true,
  });

  console.log('Users seeded:', owner.email, worker.email);

  const vendorNames = [
    { name: 'Dairy Farm Lahore', rate: 85 },
    { name: 'Green Pastures Gujranwala', rate: 80 },
    { name: 'Punjab Milk Center', rate: 82 },
  ];

  const vendors = await Promise.all(
    vendorNames.map((v) =>
      vendorRepo.save({
        name: v.name,
        defaultRate: v.rate,
        active: true,
        notes: `Primary supplier - ${v.name}`,
        createdBy: owner,
        updatedBy: owner,
      }),
    ),
  );

  console.log('Vendors seeded:', vendors.length);

  const customerNames = [
    { name: 'Malik Grocery Store', rate: 110 },
    { name: 'Al-Madina Bakery', rate: 108 },
    { name: 'Shaheen Hotel', rate: 105 },
    { name: 'City Tea House', rate: 112 },
    { name: 'Khan Family', rate: 100 },
    { name: 'Ahmed Restaurant', rate: 108 },
    { name: 'Hussain Sweet Shop', rate: 110 },
    { name: 'Green Cafe', rate: 115 },
  ];

  const customers = await Promise.all(
    customerNames.map((c) =>
      customerRepo.save({
        name: c.name,
        defaultRate: c.rate,
        active: true,
        createdBy: owner,
        updatedBy: owner,
      }),
    ),
  );

  console.log('Customers seeded:', customers.length);

  const today = new Date();
  const purchases: Partial<MilkPurchase>[] = [];
  const deliveries: Partial<MilkDelivery>[] = [];

  for (let d = 30; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(today.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];

    vendors.forEach((vendor) => {
      const qty = 50 + Math.floor(Math.random() * 50);
      const rate = vendor.defaultRate;
      purchases.push({
        vendor,
        purchaseDate: dateStr,
        quantityLiters: qty,
        ratePerLiter: rate,
        totalAmount: parseFloat((qty * rate).toFixed(2)),
        createdBy: owner,
        updatedBy: owner,
      });
    });

    customers.forEach((customer) => {
      const qty = 5 + Math.floor(Math.random() * 20);
      const rate = customer.defaultRate;
      deliveries.push({
        customer,
        deliveryDate: dateStr,
        quantityLiters: qty,
        ratePerLiter: rate,
        totalAmount: parseFloat((qty * rate).toFixed(2)),
        createdBy: worker,
        updatedBy: worker,
      });
    });
  }

  await purchaseRepo.save(purchases);
  await deliveryRepo.save(deliveries);

  console.log(`Seeded ${purchases.length} purchases and ${deliveries.length} deliveries`);
  console.log('\n=== Seed Complete ===');
  console.log('Owner login: owner@milkdairy.com / Owner@1234');
  console.log('Worker login: worker@milkdairy.com / Worker@1234');

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, Role } from '../src/modules/users/user.entity';
import { Customer } from '../src/modules/customers/customer.entity';
import { MilkDelivery } from '../src/modules/milk-deliveries/milk-delivery.entity';

describe('MilkDeliveries (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let testCustomer: Customer;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    dataSource = moduleFixture.get(DataSource);

    const userRepo = dataSource.getRepository(User);
    const customerRepo = dataSource.getRepository(Customer);
    const deliveryRepo = dataSource.getRepository(MilkDelivery);

    await deliveryRepo.delete({});
    await customerRepo.delete({ name: 'Test Customer E2E' });
    await userRepo.delete({ email: 'e2eowner@test.com' });

    const hash = await bcrypt.hash('TestPass@123', 12);
    const user = await userRepo.save({
      fullName: 'E2E Test Owner',
      email: 'e2eowner@test.com',
      passwordHash: hash,
      role: Role.OWNER,
      active: true,
    });

    testCustomer = await customerRepo.save({
      name: 'Test Customer E2E',
      defaultRate: 100,
      active: true,
      createdBy: user,
      updatedBy: user,
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `mutation { login(input: { email: "e2eowner@test.com", password: "TestPass@123" }) { accessToken } }`,
      });
    accessToken = loginResponse.body.data.login.accessToken;
  });

  afterAll(async () => {
    const deliveryRepo = dataSource.getRepository(MilkDelivery);
    const customerRepo = dataSource.getRepository(Customer);
    const userRepo = dataSource.getRepository(User);

    await deliveryRepo.delete({});
    await customerRepo.delete({ name: 'Test Customer E2E' });
    await userRepo.delete({ email: 'e2eowner@test.com' });

    await app.close();
  });

  it('should add a delivery', async () => {
    const today = new Date().toISOString().split('T')[0];
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        query: `
          mutation {
            addMilkDelivery(input: {
              customerId: "${testCustomer.id}"
              deliveryDate: "${today}"
              quantityLiters: 15.5
              ratePerLiter: 100
            }) {
              id
              quantityLiters
              totalAmount
              customer { name }
            }
          }
        `,
      })
      .expect(200);

    const delivery = response.body.data.addMilkDelivery;
    expect(delivery.quantityLiters).toBe(15.5);
    expect(delivery.totalAmount).toBe(1550);
    expect(delivery.customer.name).toBe('Test Customer E2E');
  });

  it('should reject duplicate delivery for same customer+date', async () => {
    const today = new Date().toISOString().split('T')[0];
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        query: `
          mutation {
            addMilkDelivery(input: {
              customerId: "${testCustomer.id}"
              deliveryDate: "${today}"
              quantityLiters: 10
              ratePerLiter: 100
            }) { id }
          }
        `,
      })
      .expect(200);

    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain('already exists');
  });

  it('should reject future delivery date', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        query: `
          mutation {
            addMilkDelivery(input: {
              customerId: "${testCustomer.id}"
              deliveryDate: "${futureDateStr}"
              quantityLiters: 10
              ratePerLiter: 100
            }) { id }
          }
        `,
      })
      .expect(200);

    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain('future');
  });

  it('should auto-calculate totalAmount correctly', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        query: `
          mutation {
            addMilkDelivery(input: {
              customerId: "${testCustomer.id}"
              deliveryDate: "${yesterdayStr}"
              quantityLiters: 7.5
              ratePerLiter: 108
            }) { totalAmount }
          }
        `,
      })
      .expect(200);

    expect(response.body.data.addMilkDelivery.totalAmount).toBe(810);
  });
});

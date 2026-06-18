import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, Role } from '../src/modules/users/user.entity';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get(DataSource);

    const userRepo = dataSource.getRepository(User);
    const hash = await bcrypt.hash('TestPass@123', 12);
    await userRepo.save({
      fullName: 'Test Owner',
      email: 'testowner@test.com',
      passwordHash: hash,
      role: Role.OWNER,
      active: true,
    });
  });

  afterAll(async () => {
    const userRepo = dataSource.getRepository(User);
    await userRepo.delete({ email: 'testowner@test.com' });
    await app.close();
  });

  it('should login with valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            login(input: { email: "testowner@test.com", password: "TestPass@123" }) {
              accessToken
              refreshToken
              user {
                id
                email
                role
              }
            }
          }
        `,
      })
      .expect(200);

    expect(response.body.data.login.accessToken).toBeDefined();
    expect(response.body.data.login.user.email).toBe('testowner@test.com');
    expect(response.body.data.login.user.role).toBe('OWNER');
  });

  it('should reject invalid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            login(input: { email: "testowner@test.com", password: "wrongpassword" }) {
              accessToken
            }
          }
        `,
      })
      .expect(200);

    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].code).toBe('UNAUTHENTICATED');
  });

  it('should reject unauthenticated access to protected queries', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `{ getVendors { id name } }`,
      })
      .expect(200);

    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].code).toBe('UNAUTHENTICATED');
  });

  it('should access protected query with valid token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            login(input: { email: "testowner@test.com", password: "TestPass@123" }) {
              accessToken
            }
          }
        `,
      });

    const { accessToken } = loginResponse.body.data.login;

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        query: `{ getVendors { id name } }`,
      })
      .expect(200);

    expect(response.body.data.getVendors).toBeDefined();
    expect(Array.isArray(response.body.data.getVendors)).toBe(true);
  });
});

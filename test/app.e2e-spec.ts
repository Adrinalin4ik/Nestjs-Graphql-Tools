import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { QUERY1, QUERY2, QUERY3, QUERY4, QUERY5, QUERY6, QUERY7 } from './graphql.query';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('Query 1', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: QUERY1,
        variables: {},
      })
      .expect(200);
  });
  it('Query 2', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: QUERY2,
        variables: {},
      })
      .expect(200);
  });
  it('Query 3', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: QUERY3,
        variables: {},
      })
      .expect(200);
  });
  it('Query 4', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: QUERY4,
        variables: {},
      })
      .expect(200);
  });
  it('Query 5', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: QUERY5,
        variables: {},
      })
      .expect(200);
  });
  it('Query 6', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: QUERY6,
        variables: {},
      })
      .expect(200);
  });
  it('Query 7', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: QUERY7,
        variables: {},
      })
      .expect(200);
  });
});

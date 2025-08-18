/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import { Product } from '../../src/products/product.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../../src/products/products.module';
import { ConfigModule } from '@nestjs/config';

export interface TestContext {
  app: INestApplication;
  moduleFixture: TestingModule;
  testProduct: Product;
}

export async function setupTestApp(): Promise<TestContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
      }),
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: process.env.DB_HOST || 'postgres',
        port: Number(process.env.DB_PORT || 5432),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASS || 'postgres',
        database: process.env.DB_NAME || 'final_pos',
        entities: [Product],
        synchronize: true,
        logging: false,
      }),
      ProductsModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.setGlobalPrefix('api', {
    exclude: ['health'],
  });

  app.enableVersioning({
    type: VersioningType.URI,
  });

  await app.init();

  const productRepository = moduleFixture.get(getRepositoryToken(Product));

  const existingProducts = await productRepository.find();
  if (existingProducts.length > 0) {
    await productRepository.remove(existingProducts);
  }

  const testProduct = await productRepository.save({
    name: 'Test Product',
    description: 'Test Description',
    price: '10.00',
    stock: 100,
    category: 'Test',
    image: 'data:image/png;base64,test',
    version: 1,
  });

  return { app, moduleFixture, testProduct };
}

export async function cleanupTestApp(context: TestContext) {
  if (context?.testProduct) {
    const productRepository = context.moduleFixture.get(getRepositoryToken(Product));
    await productRepository.delete({ id: context.testProduct.id });
  }
  if (context?.app) {
    await context.app.close();
  }
}

export async function resetTestProduct(context: TestContext) {
  if (context?.testProduct) {
    const productRepository = context.moduleFixture.get(getRepositoryToken(Product));
    await productRepository.update(
      { id: context.testProduct.id },
      {
        stock: 100,
        version: 1,
      },
    );
  }
}

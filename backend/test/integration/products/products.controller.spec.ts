import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { ProductsController } from '../../../src/products/products.controller';
import { ProductsService } from '../../../src/products/products.service';
import { Product, ProductSchema } from '../../../src/products/schemas/product.schema';
import { AuthModule } from '../../../src/auth/auth.module';
import { JwtAuthGuard } from '../../../src/common/guards/jwt-auth.guard';
import { CreateProductDto } from '../../../src/products/dto/create-product.dto';
import { UpdateProductDto } from '../../../src/products/dto/update-product.dto';

describe('ProductsController (Integration)', () => {
  let app: INestApplication;
  let service: ProductsService;

  const mockAuthGuard = {
    canActivate: () => true,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        MongooseModule.forRoot(
          process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/clothing_store_test',
        ),
        MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
        AuthModule,
      ],
      controllers: [ProductsController],
      providers: [ProductsService],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    service = moduleFixture.get<ProductsService>(ProductsService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await service.clearTestData();
  });

  describe('POST /api/v1/products', () => {
    it('should create a new product', async () => {
      const createProductDto: CreateProductDto = {
        code: 'SHIRT-TEST-001',
        name: 'Test Cotton Shirt',
        category: 'shirt',
        remainingQuantity: 100,
        soldQuantity: 0,
        purchasePrice: 25.0,
        sellingPrice: 50.0,
        description: 'Test shirt for integration testing',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .send(createProductDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe(createProductDto.code);
      expect(response.body.data.name).toBe(createProductDto.name);
      expect(response.body.data.category).toBe(createProductDto.category);
    });

    it('should return 400 for duplicate product code', async () => {
      const createProductDto: CreateProductDto = {
        code: 'SHIRT-DUP-001',
        name: 'Duplicate Test Shirt',
        category: 'shirt',
        remainingQuantity: 100,
        soldQuantity: 0,
      };

      // Create first product
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .send(createProductDto)
        .expect(201);

      // Try to create duplicate
      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .send(createProductDto)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DUPLICATE_KEY');
    });

    it('should return 400 for invalid category', async () => {
      const createProductDto = {
        code: 'SHIRT-INVALID-001',
        name: 'Invalid Category Shirt',
        category: 'invalid_category', // Invalid category
        remainingQuantity: 100,
        soldQuantity: 0,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .send(createProductDto)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for negative quantities', async () => {
      const createProductDto = {
        code: 'SHIRT-NEG-001',
        name: 'Negative Quantity Shirt',
        category: 'shirt',
        remainingQuantity: -5, // Invalid negative quantity
        soldQuantity: 0,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .send(createProductDto)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/products', () => {
    beforeEach(async () => {
      // Create test products
      const testProducts = [
        {
          code: 'SHIRT-LIST-001',
          name: 'Cotton Shirt Blue',
          category: 'shirt',
          remainingQuantity: 50,
          soldQuantity: 10,
        },
        {
          code: 'PANTS-LIST-001',
          name: 'Denim Jeans',
          category: 'pants',
          remainingQuantity: 30,
          soldQuantity: 5,
        },
      ];

      for (const product of testProducts) {
        await service.create(product);
      }
    });

    it('should return paginated products', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.meta.page).toBe(1);
      expect(response.body.data.meta.total).toBe(2);
    });

    it('should filter products by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ category: 'shirt' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].category).toBe('shirt');
    });

    it('should search products by text', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ search: 'cotton' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data.length).toBeGreaterThan(0);
      expect(response.body.data.data[0].name).toContain('Cotton');
    });
  });

  describe('GET /api/v1/products/:id', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await service.create({
        code: 'SHIRT-GET-001',
        name: 'Get Test Shirt',
        category: 'shirt',
        remainingQuantity: 25,
        soldQuantity: 5,
      });
      productId = product._id.toString();
    });

    it('should return a product by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${productId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe('SHIRT-GET-001');
      expect(response.body.data.name).toBe('Get Test Shirt');
    });

    it('should return 404 for non-existent product', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';

      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await service.create({
        code: 'SHIRT-UPDATE-001',
        name: 'Update Test Shirt',
        category: 'shirt',
        remainingQuantity: 25,
        soldQuantity: 5,
        sellingPrice: 45.0,
      });
      productId = product._id.toString();
    });

    it('should update a product successfully', async () => {
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Test Shirt',
        sellingPrice: 55.0,
        description: 'Updated description',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/products/${productId}`)
        .send(updateProductDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateProductDto.name);
      expect(response.body.data.sellingPrice).toBe(updateProductDto.sellingPrice);
      expect(response.body.data.description).toBe(updateProductDto.description);
    });

    it('should return 404 when updating non-existent product', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const updateProductDto: UpdateProductDto = {
        name: 'Non-existent Product',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/products/${nonExistentId}`)
        .send(updateProductDto)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid update data', async () => {
      const updateProductDto = {
        remainingQuantity: -10, // Invalid negative quantity
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/products/${productId}`)
        .send(updateProductDto)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await service.create({
        code: 'SHIRT-DELETE-001',
        name: 'Delete Test Shirt',
        category: 'shirt',
        remainingQuantity: 25,
        soldQuantity: 5,
      });
      productId = product._id.toString();
    });

    it('should soft delete a product', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/products/${productId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);

      // Verify product is not returned in list
      const listResponse = await request(app.getHttpServer()).get('/api/v1/products').expect(200);

      const deletedProduct = listResponse.body.data.data.find(p => p._id === productId);
      expect(deletedProduct).toBeUndefined();
    });

    it('should return 404 when deleting non-existent product', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/products/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Authentication', () => {
    it('should require authentication for protected endpoints', async () => {
      // Override the mock guard to simulate unauthenticated request
      const unauthorizedGuard = {
        canActivate: () => false,
      };

      const testModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ isGlobal: true }),
          MongooseModule.forRoot(
            process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/clothing_store_test',
          ),
          MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
          AuthModule,
        ],
        controllers: [ProductsController],
        providers: [ProductsService],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue(unauthorizedGuard)
        .compile();

      const unauthorizedApp = testModule.createNestApplication();
      await unauthorizedApp.init();

      const response = await request(unauthorizedApp.getHttpServer())
        .post('/api/v1/products')
        .send({
          code: 'UNAUTH-001',
          name: 'Unauthorized Test',
          category: 'shirt',
          remainingQuantity: 10,
          soldQuantity: 0,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');

      await unauthorizedApp.close();
    });
  });
});

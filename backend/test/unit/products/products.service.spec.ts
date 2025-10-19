import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductsService } from '../../../src/products/products.service';
import { Product, ProductDocument } from '../../../src/products/schemas/product.schema';
import { CreateProductDto } from '../../../src/products/dto/create-product.dto';
import { UpdateProductDto } from '../../../src/products/dto/update-product.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let model: Model<ProductDocument>;

  const mockProduct = {
    _id: '507f1f77bcf86cd799439011',
    code: 'SHIRT-001',
    name: 'Classic Cotton Shirt',
    category: 'shirt',
    remainingQuantity: 100,
    soldQuantity: 0,
    purchasePrice: 25.0,
    sellingPrice: 50.0,
    description: 'High-quality cotton shirt',
    isActive: true,
    variants: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProductModel = {
    new: jest.fn().mockResolvedValue(mockProduct),
    constructor: jest.fn().mockResolvedValue(mockProduct),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    model = module.get<Model<ProductDocument>>(getModelToken(Product.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new product successfully', async () => {
      const createProductDto: CreateProductDto = {
        code: 'SHIRT-001',
        name: 'Classic Cotton Shirt',
        category: 'shirt',
        remainingQuantity: 100,
        soldQuantity: 0,
        purchasePrice: 25.0,
        sellingPrice: 50.0,
        description: 'High-quality cotton shirt',
      };

      mockProductModel.create.mockResolvedValue(mockProduct);

      const result = await service.create(createProductDto);

      expect(mockProductModel.create).toHaveBeenCalledWith(createProductDto);
      expect(result).toEqual(mockProduct);
    });

    it('should throw BadRequestException when duplicate code is provided', async () => {
      const createProductDto: CreateProductDto = {
        code: 'SHIRT-001',
        name: 'Classic Cotton Shirt',
        category: 'shirt',
        remainingQuantity: 100,
        soldQuantity: 0,
      };

      const duplicateError = new Error('Duplicate key error');
      (duplicateError as any).code = 11000;
      mockProductModel.create.mockRejectedValue(duplicateError);

      await expect(service.create(createProductDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid category', async () => {
      const createProductDto: CreateProductDto = {
        code: 'INVALID-001',
        name: 'Invalid Product',
        category: 'invalid_category' as any,
        remainingQuantity: 100,
        soldQuantity: 0,
      };

      const validationError = new Error('Validation failed');
      mockProductModel.create.mockRejectedValue(validationError);

      await expect(service.create(createProductDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated products with default parameters', async () => {
      const mockProducts = [mockProduct];
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProducts),
      };

      mockProductModel.find.mockReturnValue(mockQuery);
      mockProductModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(mockProductModel.find).toHaveBeenCalledWith({ isActive: true });
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(result.data).toEqual(mockProducts);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by category when provided', async () => {
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockProduct]),
      };

      mockProductModel.find.mockReturnValue(mockQuery);
      mockProductModel.countDocuments.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, category: 'shirt' });

      expect(mockProductModel.find).toHaveBeenCalledWith({
        isActive: true,
        category: 'shirt',
      });
    });

    it('should search by text when search term is provided', async () => {
      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockProduct]),
      };

      mockProductModel.find.mockReturnValue(mockQuery);
      mockProductModel.countDocuments.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, search: 'cotton' });

      expect(mockProductModel.find).toHaveBeenCalledWith({
        isActive: true,
        $text: { $search: 'cotton' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a product by ID', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProduct),
      };

      mockProductModel.findOne.mockReturnValue(mockQuery);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(mockProductModel.findOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
        isActive: true,
      });
      expect(mockQuery.populate).toHaveBeenCalledWith('variants');
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      mockProductModel.findOne.mockReturnValue(mockQuery);

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should return a product by code', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProduct),
      };

      mockProductModel.findOne.mockReturnValue(mockQuery);

      const result = await service.findByCode('SHIRT-001');

      expect(mockProductModel.findOne).toHaveBeenCalledWith({
        code: 'SHIRT-001',
        isActive: true,
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product code not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      mockProductModel.findOne.mockReturnValue(mockQuery);

      await expect(service.findByCode('NONEXISTENT')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a product successfully', async () => {
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Cotton Shirt',
        sellingPrice: 55.0,
      };

      const updatedProduct = { ...mockProduct, ...updateProductDto };

      mockProductModel.findOneAndUpdate.mockResolvedValue(updatedProduct);

      const result = await service.update('507f1f77bcf86cd799439011', updateProductDto);

      expect(mockProductModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439011', isActive: true },
        updateProductDto,
        { new: true, runValidators: true },
      );
      expect(result).toEqual(updatedProduct);
    });

    it('should throw NotFoundException when updating non-existent product', async () => {
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Name',
      };

      mockProductModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(service.update('507f1f77bcf86cd799439011', updateProductDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid update data', async () => {
      const updateProductDto: UpdateProductDto = {
        remainingQuantity: -5, // Invalid negative quantity
      };

      const validationError = new Error('Validation failed');
      mockProductModel.findOneAndUpdate.mockRejectedValue(validationError);

      await expect(service.update('507f1f77bcf86cd799439011', updateProductDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a product (set isActive to false)', async () => {
      const deactivatedProduct = { ...mockProduct, isActive: false };

      mockProductModel.findOneAndUpdate.mockResolvedValue(deactivatedProduct);

      const result = await service.remove('507f1f77bcf86cd799439011');

      expect(mockProductModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439011', isActive: true },
        { isActive: false },
        { new: true },
      );
      expect(result).toEqual(deactivatedProduct);
    });

    it('should throw NotFoundException when deleting non-existent product', async () => {
      mockProductModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateQuantities', () => {
    it('should update remaining and sold quantities', async () => {
      const updatedProduct = {
        ...mockProduct,
        remainingQuantity: 90,
        soldQuantity: 10,
      };

      mockProductModel.findOneAndUpdate.mockResolvedValue(updatedProduct);

      const result = await service.updateQuantities('507f1f77bcf86cd799439011', 90, 10);

      expect(mockProductModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439011', isActive: true },
        { remainingQuantity: 90, soldQuantity: 10 },
        { new: true },
      );
      expect(result).toEqual(updatedProduct);
    });

    it('should throw BadRequestException for negative quantities', async () => {
      await expect(service.updateQuantities('507f1f77bcf86cd799439011', -5, 10)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.updateQuantities('507f1f77bcf86cd799439011', 90, -5)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

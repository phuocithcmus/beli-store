import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductVariantsService } from '../../../src/variants/product-variants.service';
import {
  ProductVariant,
  ProductVariantDocument,
} from '../../../src/variants/schemas/product-variant.schema';
import { CreateProductVariantDto } from '../../../src/variants/dto/create-product-variant.dto';
import { UpdateProductVariantDto } from '../../../src/variants/dto/update-product-variant.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ProductVariantsService', () => {
  let service: ProductVariantsService;
  let model: Model<ProductVariantDocument>;

  const mockProductVariant = {
    _id: '507f1f77bcf86cd799439012',
    productId: '507f1f77bcf86cd799439011',
    color: 'blue',
    size: 'M',
    form: 'slim',
    quantity: 50,
    purchasePrice: 23.0,
    sellingPrice: 48.0,
    sku: 'SHIRT-001-BLU-M-SLIM',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProductVariantModel = {
    new: jest.fn().mockResolvedValue(mockProductVariant),
    constructor: jest.fn().mockResolvedValue(mockProductVariant),
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
        ProductVariantsService,
        {
          provide: getModelToken(ProductVariant.name),
          useValue: mockProductVariantModel,
        },
      ],
    }).compile();

    service = module.get<ProductVariantsService>(ProductVariantsService);
    model = module.get<Model<ProductVariantDocument>>(getModelToken(ProductVariant.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new product variant successfully', async () => {
      const createVariantDto: CreateProductVariantDto = {
        productId: '507f1f77bcf86cd799439011',
        color: 'blue',
        size: 'M',
        form: 'slim',
        quantity: 50,
        purchasePrice: 23.0,
        sellingPrice: 48.0,
      };

      mockProductVariantModel.create.mockResolvedValue(mockProductVariant);

      const result = await service.create(createVariantDto);

      expect(mockProductVariantModel.create).toHaveBeenCalledWith(createVariantDto);
      expect(result).toEqual(mockProductVariant);
    });

    it('should throw BadRequestException when duplicate variant is created', async () => {
      const createVariantDto: CreateProductVariantDto = {
        productId: '507f1f77bcf86cd799439011',
        color: 'blue',
        size: 'M',
        form: 'slim',
        quantity: 50,
      };

      const duplicateError = new Error('Duplicate key error');
      (duplicateError as any).code = 11000;
      mockProductVariantModel.create.mockRejectedValue(duplicateError);

      await expect(service.create(createVariantDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid product reference', async () => {
      const createVariantDto: CreateProductVariantDto = {
        productId: 'invalid-product-id',
        color: 'blue',
        size: 'M',
        form: 'slim',
        quantity: 50,
      };

      const validationError = new Error('Invalid reference');
      mockProductVariantModel.create.mockRejectedValue(validationError);

      await expect(service.create(createVariantDto)).rejects.toThrow(BadRequestException);
    });

    it('should auto-generate SKU when not provided', async () => {
      const createVariantDto: CreateProductVariantDto = {
        productId: '507f1f77bcf86cd799439011',
        color: 'red',
        size: 'L',
        form: 'regular',
        quantity: 30,
      };

      const variantWithSku = {
        ...mockProductVariant,
        ...createVariantDto,
        sku: 'VAR-RED-L-REGULAR',
      };

      mockProductVariantModel.create.mockResolvedValue(variantWithSku);

      const result = await service.create(createVariantDto);

      expect(result.sku).toBeDefined();
      expect(result.sku).toContain('RED');
      expect(result.sku).toContain('L');
    });
  });

  describe('findAll', () => {
    it('should return all variants with pagination', async () => {
      const mockVariants = [mockProductVariant];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockVariants),
      };

      mockProductVariantModel.find.mockReturnValue(mockQuery);
      mockProductVariantModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(mockProductVariantModel.find).toHaveBeenCalledWith({ isActive: true });
      expect(mockQuery.populate).toHaveBeenCalledWith('productId');
      expect(result.data).toEqual(mockVariants);
      expect(result.meta.total).toBe(1);
    });

    it('should filter variants by product ID', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockProductVariant]),
      };

      mockProductVariantModel.find.mockReturnValue(mockQuery);
      mockProductVariantModel.countDocuments.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        productId: '507f1f77bcf86cd799439011',
      });

      expect(mockProductVariantModel.find).toHaveBeenCalledWith({
        isActive: true,
        productId: '507f1f77bcf86cd799439011',
      });
    });

    it('should filter variants by color', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockProductVariant]),
      };

      mockProductVariantModel.find.mockReturnValue(mockQuery);
      mockProductVariantModel.countDocuments.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, color: 'blue' });

      expect(mockProductVariantModel.find).toHaveBeenCalledWith({
        isActive: true,
        color: 'blue',
      });
    });
  });

  describe('findOne', () => {
    it('should return a variant by ID', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProductVariant),
      };

      mockProductVariantModel.findOne.mockReturnValue(mockQuery);

      const result = await service.findOne('507f1f77bcf86cd799439012');

      expect(mockProductVariantModel.findOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439012',
        isActive: true,
      });
      expect(mockQuery.populate).toHaveBeenCalledWith('productId');
      expect(result).toEqual(mockProductVariant);
    });

    it('should throw NotFoundException when variant not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      mockProductVariantModel.findOne.mockReturnValue(mockQuery);

      await expect(service.findOne('507f1f77bcf86cd799439012')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByProduct', () => {
    it('should return all variants for a specific product', async () => {
      const mockVariants = [mockProductVariant];
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockVariants),
      };

      mockProductVariantModel.find.mockReturnValue(mockQuery);

      const result = await service.findByProduct('507f1f77bcf86cd799439011');

      expect(mockProductVariantModel.find).toHaveBeenCalledWith({
        productId: '507f1f77bcf86cd799439011',
        isActive: true,
      });
      expect(result).toEqual(mockVariants);
    });

    it('should return empty array when no variants found for product', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      mockProductVariantModel.find.mockReturnValue(mockQuery);

      const result = await service.findByProduct('507f1f77bcf86cd799439011');

      expect(result).toEqual([]);
    });
  });

  describe('findBySku', () => {
    it('should return variant by SKU', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProductVariant),
      };

      mockProductVariantModel.findOne.mockReturnValue(mockQuery);

      const result = await service.findBySku('SHIRT-001-BLU-M-SLIM');

      expect(mockProductVariantModel.findOne).toHaveBeenCalledWith({
        sku: 'SHIRT-001-BLU-M-SLIM',
        isActive: true,
      });
      expect(result).toEqual(mockProductVariant);
    });

    it('should throw NotFoundException when SKU not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      mockProductVariantModel.findOne.mockReturnValue(mockQuery);

      await expect(service.findBySku('NONEXISTENT-SKU')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a variant successfully', async () => {
      const updateVariantDto: UpdateProductVariantDto = {
        quantity: 75,
        sellingPrice: 52.0,
      };

      const updatedVariant = { ...mockProductVariant, ...updateVariantDto };

      mockProductVariantModel.findOneAndUpdate.mockResolvedValue(updatedVariant);

      const result = await service.update('507f1f77bcf86cd799439012', updateVariantDto);

      expect(mockProductVariantModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439012', isActive: true },
        updateVariantDto,
        { new: true, runValidators: true },
      );
      expect(result).toEqual(updatedVariant);
    });

    it('should throw NotFoundException when updating non-existent variant', async () => {
      const updateVariantDto: UpdateProductVariantDto = {
        quantity: 75,
      };

      mockProductVariantModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(service.update('507f1f77bcf86cd799439012', updateVariantDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid update data', async () => {
      const updateVariantDto: UpdateProductVariantDto = {
        quantity: -10, // Invalid negative quantity
      };

      const validationError = new Error('Validation failed');
      mockProductVariantModel.findOneAndUpdate.mockRejectedValue(validationError);

      await expect(service.update('507f1f77bcf86cd799439012', updateVariantDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a variant (set isActive to false)', async () => {
      const deactivatedVariant = { ...mockProductVariant, isActive: false };

      mockProductVariantModel.findOneAndUpdate.mockResolvedValue(deactivatedVariant);

      const result = await service.remove('507f1f77bcf86cd799439012');

      expect(mockProductVariantModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439012', isActive: true },
        { isActive: false },
        { new: true },
      );
      expect(result).toEqual(deactivatedVariant);
    });

    it('should throw NotFoundException when deleting non-existent variant', async () => {
      mockProductVariantModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(service.remove('507f1f77bcf86cd799439012')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateQuantity', () => {
    it('should update variant quantity', async () => {
      const updatedVariant = { ...mockProductVariant, quantity: 25 };

      mockProductVariantModel.findOneAndUpdate.mockResolvedValue(updatedVariant);

      const result = await service.updateQuantity('507f1f77bcf86cd799439012', 25);

      expect(mockProductVariantModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439012', isActive: true },
        { quantity: 25 },
        { new: true },
      );
      expect(result).toEqual(updatedVariant);
    });

    it('should throw BadRequestException for negative quantity', async () => {
      await expect(service.updateQuantity('507f1f77bcf86cd799439012', -5)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when variant not found', async () => {
      mockProductVariantModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(service.updateQuantity('507f1f77bcf86cd799439012', 25)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getVariantCombinations', () => {
    it('should return unique color/size/form combinations for a product', async () => {
      const mockCombinations = [
        { color: 'blue', size: 'M', form: 'slim' },
        { color: 'red', size: 'L', form: 'regular' },
      ];

      const mockQuery = {
        distinct: jest.fn().mockResolvedValue(['blue', 'red']),
      };

      mockProductVariantModel.find.mockReturnValue(mockQuery);

      // Mock the distinct calls for size and form as well
      mockProductVariantModel.find
        .mockReturnValueOnce({ distinct: jest.fn().mockResolvedValue(['blue', 'red']) })
        .mockReturnValueOnce({ distinct: jest.fn().mockResolvedValue(['M', 'L']) })
        .mockReturnValueOnce({ distinct: jest.fn().mockResolvedValue(['slim', 'regular']) });

      const result = await service.getVariantCombinations('507f1f77bcf86cd799439011');

      expect(result).toHaveProperty('colors');
      expect(result).toHaveProperty('sizes');
      expect(result).toHaveProperty('forms');
    });
  });
});

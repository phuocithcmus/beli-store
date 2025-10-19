import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ImportPhasesService } from '../../../src/imports/import-phases.service';
import { ImportPhase, ImportPhaseDocument } from '../../../src/imports/schemas/import-phase.schema';
import { CreateImportPhaseDto } from '../../../src/imports/dto/create-import-phase.dto';
import { UpdateImportPhaseDto } from '../../../src/imports/dto/update-import-phase.dto';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

describe('ImportPhasesService', () => {
  let service: ImportPhasesService;
  let model: Model<ImportPhaseDocument>;

  const mockImportPhase = {
    _id: '507f1f77bcf86cd799439013',
    phaseNumber: 'IMP-2025-001',
    description: 'Spring Collection Import',
    status: 'planning',
    totalCost: 2500.0,
    expectedDeliveryDate: new Date('2025-12-01'),
    actualDeliveryDate: null,
    supplier: 'Fashion Supplier Co.',
    notes: 'First batch of spring items',
    items: [],
    fees: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockImportPhaseModel = {
    new: jest.fn().mockResolvedValue(mockImportPhase),
    constructor: jest.fn().mockResolvedValue(mockImportPhase),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportPhasesService,
        {
          provide: getModelToken(ImportPhase.name),
          useValue: mockImportPhaseModel,
        },
      ],
    }).compile();

    service = module.get<ImportPhasesService>(ImportPhasesService);
    model = module.get<Model<ImportPhaseDocument>>(getModelToken(ImportPhase.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new import phase successfully', async () => {
      const createImportPhaseDto: CreateImportPhaseDto = {
        phaseNumber: 'IMP-2025-001',
        description: 'Spring Collection Import',
        totalCost: 2500.0,
        expectedDeliveryDate: new Date('2025-12-01'),
        supplier: 'Fashion Supplier Co.',
        notes: 'First batch of spring items',
      };

      mockImportPhaseModel.create.mockResolvedValue(mockImportPhase);

      const result = await service.create(createImportPhaseDto);

      expect(mockImportPhaseModel.create).toHaveBeenCalledWith({
        ...createImportPhaseDto,
        status: 'planning', // Default status
      });
      expect(result).toEqual(mockImportPhase);
    });

    it('should throw BadRequestException when duplicate phase number is provided', async () => {
      const createImportPhaseDto: CreateImportPhaseDto = {
        phaseNumber: 'IMP-2025-001',
        description: 'Duplicate Import',
        totalCost: 1000.0,
        expectedDeliveryDate: new Date('2025-12-01'),
        supplier: 'Test Supplier',
      };

      const duplicateError = new Error('Duplicate key error');
      (duplicateError as any).code = 11000;
      mockImportPhaseModel.create.mockRejectedValue(duplicateError);

      await expect(service.create(createImportPhaseDto)).rejects.toThrow(BadRequestException);
    });

    it('should auto-generate phase number when not provided', async () => {
      const createImportPhaseDto: CreateImportPhaseDto = {
        description: 'Auto-numbered Import',
        totalCost: 1500.0,
        expectedDeliveryDate: new Date('2025-12-01'),
        supplier: 'Auto Supplier',
      };

      const phaseWithAutoNumber = {
        ...mockImportPhase,
        phaseNumber: 'IMP-2025-AUTO-001',
      };

      mockImportPhaseModel.create.mockResolvedValue(phaseWithAutoNumber);

      const result = await service.create(createImportPhaseDto);

      expect(result.phaseNumber).toBeDefined();
      expect(result.phaseNumber).toMatch(/^IMP-\d{4}-/);
    });

    it('should throw BadRequestException for invalid cost', async () => {
      const createImportPhaseDto: CreateImportPhaseDto = {
        phaseNumber: 'IMP-2025-002',
        description: 'Invalid Cost Import',
        totalCost: -100.0, // Invalid negative cost
        expectedDeliveryDate: new Date('2025-12-01'),
        supplier: 'Test Supplier',
      };

      const validationError = new Error('Validation failed');
      mockImportPhaseModel.create.mockRejectedValue(validationError);

      await expect(service.create(createImportPhaseDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated import phases with default parameters', async () => {
      const mockPhases = [mockImportPhase];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPhases),
      };

      mockImportPhaseModel.find.mockReturnValue(mockQuery);
      mockImportPhaseModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(mockImportPhaseModel.find).toHaveBeenCalledWith({ isActive: true });
      expect(mockQuery.populate).toHaveBeenCalledWith(['items', 'fees']);
      expect(result.data).toEqual(mockPhases);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by status when provided', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockImportPhase]),
      };

      mockImportPhaseModel.find.mockReturnValue(mockQuery);
      mockImportPhaseModel.countDocuments.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, status: 'planning' });

      expect(mockImportPhaseModel.find).toHaveBeenCalledWith({
        isActive: true,
        status: 'planning',
      });
    });

    it('should filter by date range when provided', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockImportPhase]),
      };

      mockImportPhaseModel.find.mockReturnValue(mockQuery);
      mockImportPhaseModel.countDocuments.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        startDate,
        endDate,
      });

      expect(mockImportPhaseModel.find).toHaveBeenCalledWith({
        isActive: true,
        expectedDeliveryDate: {
          $gte: startDate,
          $lte: endDate,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return an import phase by ID', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockImportPhase),
      };

      mockImportPhaseModel.findOne.mockReturnValue(mockQuery);

      const result = await service.findOne('507f1f77bcf86cd799439013');

      expect(mockImportPhaseModel.findOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439013',
        isActive: true,
      });
      expect(mockQuery.populate).toHaveBeenCalledWith(['items', 'fees']);
      expect(result).toEqual(mockImportPhase);
    });

    it('should throw NotFoundException when import phase not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      mockImportPhaseModel.findOne.mockReturnValue(mockQuery);

      await expect(service.findOne('507f1f77bcf86cd799439013')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByPhaseNumber', () => {
    it('should return import phase by phase number', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockImportPhase),
      };

      mockImportPhaseModel.findOne.mockReturnValue(mockQuery);

      const result = await service.findByPhaseNumber('IMP-2025-001');

      expect(mockImportPhaseModel.findOne).toHaveBeenCalledWith({
        phaseNumber: 'IMP-2025-001',
        isActive: true,
      });
      expect(result).toEqual(mockImportPhase);
    });

    it('should throw NotFoundException when phase number not found', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      mockImportPhaseModel.findOne.mockReturnValue(mockQuery);

      await expect(service.findByPhaseNumber('NONEXISTENT')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an import phase successfully', async () => {
      const updateImportPhaseDto: UpdateImportPhaseDto = {
        description: 'Updated Spring Collection Import',
        totalCost: 2750.0,
        notes: 'Updated notes',
      };

      const updatedPhase = { ...mockImportPhase, ...updateImportPhaseDto };

      mockImportPhaseModel.findOneAndUpdate.mockResolvedValue(updatedPhase);

      const result = await service.update('507f1f77bcf86cd799439013', updateImportPhaseDto);

      expect(mockImportPhaseModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439013', isActive: true },
        updateImportPhaseDto,
        { new: true, runValidators: true },
      );
      expect(result).toEqual(updatedPhase);
    });

    it('should throw NotFoundException when updating non-existent phase', async () => {
      const updateImportPhaseDto: UpdateImportPhaseDto = {
        description: 'Updated description',
      };

      mockImportPhaseModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.update('507f1f77bcf86cd799439013', updateImportPhaseDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when trying to update completed phase', async () => {
      const completedPhase = { ...mockImportPhase, status: 'completed' };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(completedPhase),
      };

      mockImportPhaseModel.findOne.mockReturnValue(mockQuery);

      const updateImportPhaseDto: UpdateImportPhaseDto = {
        description: 'Cannot update completed phase',
      };

      await expect(
        service.update('507f1f77bcf86cd799439013', updateImportPhaseDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateStatus', () => {
    it('should update import phase status to in-progress', async () => {
      const updatedPhase = { ...mockImportPhase, status: 'in-progress' };

      mockImportPhaseModel.findOneAndUpdate.mockResolvedValue(updatedPhase);

      const result = await service.updateStatus('507f1f77bcf86cd799439013', 'in-progress');

      expect(mockImportPhaseModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439013', isActive: true },
        { status: 'in-progress' },
        { new: true },
      );
      expect(result.status).toBe('in-progress');
    });

    it('should update to completed and set actual delivery date', async () => {
      const actualDate = new Date();
      const updatedPhase = {
        ...mockImportPhase,
        status: 'completed',
        actualDeliveryDate: actualDate,
      };

      mockImportPhaseModel.findOneAndUpdate.mockResolvedValue(updatedPhase);

      const result = await service.updateStatus('507f1f77bcf86cd799439013', 'completed');

      expect(mockImportPhaseModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439013', isActive: true },
        {
          status: 'completed',
          actualDeliveryDate: expect.any(Date),
        },
        { new: true },
      );
      expect(result.status).toBe('completed');
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const completedPhase = { ...mockImportPhase, status: 'completed' };
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(completedPhase),
      };

      mockImportPhaseModel.findOne.mockReturnValue(mockQuery);

      await expect(service.updateStatus('507f1f77bcf86cd799439013', 'planning')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete an import phase (set isActive to false)', async () => {
      const deactivatedPhase = { ...mockImportPhase, isActive: false };

      mockImportPhaseModel.findOneAndUpdate.mockResolvedValue(deactivatedPhase);

      const result = await service.remove('507f1f77bcf86cd799439013');

      expect(mockImportPhaseModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439013', isActive: true },
        { isActive: false },
        { new: true },
      );
      expect(result).toEqual(deactivatedPhase);
    });

    it('should throw ConflictException when trying to delete in-progress phase', async () => {
      const inProgressPhase = { ...mockImportPhase, status: 'in-progress' };
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(inProgressPhase),
      };

      mockImportPhaseModel.findOne.mockReturnValue(mockQuery);

      await expect(service.remove('507f1f77bcf86cd799439013')).rejects.toThrow(ConflictException);
    });
  });

  describe('getCostSummary', () => {
    it('should return cost summary for an import phase', async () => {
      const mockSummary = [
        {
          _id: '507f1f77bcf86cd799439013',
          totalCost: 2500.0,
          totalItems: 50,
          averageCostPerItem: 50.0,
          totalFees: 250.0,
        },
      ];

      mockImportPhaseModel.aggregate.mockResolvedValue(mockSummary);

      const result = await service.getCostSummary('507f1f77bcf86cd799439013');

      expect(mockImportPhaseModel.aggregate).toHaveBeenCalled();
      expect(result).toEqual(mockSummary[0]);
    });
  });

  describe('getStatusStatistics', () => {
    it('should return statistics by status', async () => {
      const mockStats = [
        { _id: 'planning', count: 5, totalCost: 12500.0 },
        { _id: 'in-progress', count: 3, totalCost: 7500.0 },
        { _id: 'completed', count: 10, totalCost: 25000.0 },
      ];

      mockImportPhaseModel.aggregate.mockResolvedValue(mockStats);

      const result = await service.getStatusStatistics();

      expect(mockImportPhaseModel.aggregate).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });
});

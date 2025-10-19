import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ChannelFeeStructuresService } from '../../../src/channels/channel-fee-structures.service';
import {
  ChannelFeeStructure,
  ChannelFeeStructureDocument,
  FeeType,
  FeeCalculationType,
  FeeFrequency,
} from '../../../src/channels/schemas/channel-fee-structure.schema';
import { CreateChannelFeeStructureDto } from '../../../src/channels/dto/create-channel-fee-structure.dto';
import { UpdateChannelFeeStructureDto } from '../../../src/channels/dto/update-channel-fee-structure.dto';

describe('ChannelFeeStructuresService', () => {
  let service: ChannelFeeStructuresService;
  let model: Model<ChannelFeeStructureDocument>;

  const mockChannelId = new Types.ObjectId('507f1f77bcf86cd799439011');
  const mockFeeStructure = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
    channelId: mockChannelId,
    code: 'TRANS_FEE_001',
    name: 'Transaction Fee',
    type: FeeType.TRANSACTION,
    calculationType: FeeCalculationType.PERCENTAGE,
    frequency: FeeFrequency.PER_TRANSACTION,
    percentage: 2.5,
    currency: 'USD',
    description: 'Standard transaction fee',
    isActive: true,
    statistics: {
      totalApplied: 0,
      totalAmount: 0,
      averageFeeAmount: 0,
      applicationCount: 0,
    },
    tags: [],
    metadata: {
      changeLog: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
    calculateFee: jest.fn().mockReturnValue(2.5),
  };

  const mockFeeStructureModel = {
    new: jest.fn().mockResolvedValue(mockFeeStructure),
    constructor: jest.fn().mockResolvedValue(mockFeeStructure),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    exec: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
    populate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelFeeStructuresService,
        {
          provide: getModelToken(ChannelFeeStructure.name),
          useValue: mockFeeStructureModel,
        },
      ],
    }).compile();

    service = module.get<ChannelFeeStructuresService>(ChannelFeeStructuresService);
    model = module.get<Model<ChannelFeeStructureDocument>>(getModelToken(ChannelFeeStructure.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a fee structure successfully', async () => {
      const createDto: CreateChannelFeeStructureDto = {
        channelId: mockChannelId,
        code: 'TRANS_FEE_001',
        name: 'Transaction Fee',
        type: FeeType.TRANSACTION,
        calculationType: FeeCalculationType.PERCENTAGE,
        frequency: FeeFrequency.PER_TRANSACTION,
        percentage: 2.5,
        currency: 'USD',
        description: 'Standard transaction fee',
      };

      const saveSpy = jest.spyOn(mockFeeStructure, 'save').mockResolvedValue(mockFeeStructure);
      jest.spyOn(model, 'constructor' as any).mockImplementation(() => mockFeeStructure);

      const result = await service.create(createDto);

      expect(saveSpy).toHaveBeenCalled();
      expect(result).toEqual(mockFeeStructure);
    });

    it('should throw ConflictException when code already exists', async () => {
      const createDto: CreateChannelFeeStructureDto = {
        channelId: mockChannelId,
        code: 'EXISTING_CODE',
        name: 'Test Fee',
        type: FeeType.TRANSACTION,
        calculationType: FeeCalculationType.PERCENTAGE,
        frequency: FeeFrequency.PER_TRANSACTION,
      };

      const duplicateError = { code: 11000, keyPattern: { code: 1 } };
      jest.spyOn(mockFeeStructure, 'save').mockRejectedValue(duplicateError);
      jest.spyOn(model, 'constructor' as any).mockImplementation(() => mockFeeStructure);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated fee structures', async () => {
      const feeStructures = [mockFeeStructure];
      const total = 1;

      mockFeeStructureModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(feeStructures),
              }),
            }),
          }),
        }),
      });

      mockFeeStructureModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(total),
      });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        feeStructures,
        total,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter fee structures by channel ID', async () => {
      const feeStructures = [mockFeeStructure];
      const total = 1;

      mockFeeStructureModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(feeStructures),
              }),
            }),
          }),
        }),
      });

      mockFeeStructureModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(total),
      });

      await service.findAll({ channelId: mockChannelId.toString() });

      expect(mockFeeStructureModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ channelId: mockChannelId }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a fee structure by ID', async () => {
      const id = '507f1f77bcf86cd799439012';

      mockFeeStructureModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockFeeStructure),
        }),
      });

      const result = await service.findOne(id);

      expect(mockFeeStructureModel.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockFeeStructure);
    });

    it('should throw BadRequestException for invalid ID', async () => {
      const invalidId = 'invalid-id';

      await expect(service.findOne(invalidId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when fee structure not found', async () => {
      const id = '507f1f77bcf86cd799439012';

      mockFeeStructureModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should return a fee structure by code', async () => {
      const code = 'TRANS_FEE_001';

      mockFeeStructureModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockFeeStructure),
        }),
      });

      const result = await service.findByCode(code);

      expect(mockFeeStructureModel.findOne).toHaveBeenCalledWith({
        code: code.toUpperCase(),
      });
      expect(result).toEqual(mockFeeStructure);
    });
  });

  describe('findByChannel', () => {
    it('should return fee structures for a specific channel', async () => {
      const channelId = mockChannelId.toString();
      const feeStructures = [mockFeeStructure];

      mockFeeStructureModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(feeStructures),
          }),
        }),
      });

      const result = await service.findByChannel(channelId);

      expect(mockFeeStructureModel.find).toHaveBeenCalledWith({
        channelId: mockChannelId,
      });
      expect(result).toEqual(feeStructures);
    });

    it('should filter by type when provided', async () => {
      const channelId = mockChannelId.toString();
      const feeStructures = [mockFeeStructure];

      mockFeeStructureModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(feeStructures),
          }),
        }),
      });

      await service.findByChannel(channelId, { type: FeeType.TRANSACTION });

      expect(mockFeeStructureModel.find).toHaveBeenCalledWith({
        channelId: mockChannelId,
        type: FeeType.TRANSACTION,
      });
    });
  });

  describe('update', () => {
    it('should update a fee structure successfully', async () => {
      const id = '507f1f77bcf86cd799439012';
      const updateDto: UpdateChannelFeeStructureDto = {
        name: 'Updated Fee Structure',
        description: 'Updated description',
      };

      mockFeeStructureModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ ...mockFeeStructure, ...updateDto }),
        }),
      });

      const result = await service.update(id, updateDto);

      expect(mockFeeStructureModel.findByIdAndUpdate).toHaveBeenCalledWith(id, updateDto, {
        new: true,
        runValidators: true,
      });
      expect(result.name).toBe('Updated Fee Structure');
    });

    it('should throw NotFoundException when fee structure not found', async () => {
      const id = '507f1f77bcf86cd799439012';
      const updateDto: UpdateChannelFeeStructureDto = { name: 'Updated Fee' };

      mockFeeStructureModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.update(id, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('calculateFee', () => {
    it('should calculate fee using the fee structure', async () => {
      const id = '507f1f77bcf86cd799439012';
      const amount = 100;

      mockFeeStructureModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockFeeStructure),
        }),
      });

      const result = await service.calculateFee(id, amount);

      expect(result).toEqual({
        feeStructure: mockFeeStructure,
        calculatedFee: 2.5,
        breakdown: expect.objectContaining({
          originalAmount: amount,
          feeType: FeeType.TRANSACTION,
          calculationType: FeeCalculationType.PERCENTAGE,
          finalFee: 2.5,
        }),
      });
    });
  });

  describe('updateStatistics', () => {
    it('should update fee structure statistics successfully', async () => {
      const id = '507f1f77bcf86cd799439012';
      const updates = {
        totalApplied: 10,
        totalAmount: 25,
        applicationCount: 10,
      };

      mockFeeStructureModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockFeeStructure),
      });

      mockFeeStructureModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            ...mockFeeStructure,
            statistics: { ...mockFeeStructure.statistics, ...updates },
          }),
        }),
      });

      const result = await service.updateStatistics(id, updates);

      expect(result.statistics.totalApplied).toBe(10);
      expect(result.statistics.totalAmount).toBe(25);
      expect(result.statistics.applicationCount).toBe(10);
    });
  });

  describe('incrementStatistics', () => {
    it('should increment fee structure statistics successfully', async () => {
      const id = '507f1f77bcf86cd799439012';
      const increments = { applied: 2, amount: 5 };

      const updatedFeeStructure = {
        ...mockFeeStructure,
        statistics: {
          ...mockFeeStructure.statistics,
          totalApplied: 2,
          totalAmount: 5,
          applicationCount: 2,
        },
        save: jest.fn().mockResolvedValue(this),
      };

      mockFeeStructureModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(updatedFeeStructure),
        }),
      });

      const result = await service.incrementStatistics(id, increments);

      expect(mockFeeStructureModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        {
          $inc: {
            'statistics.totalApplied': 2,
            'statistics.applicationCount': 2,
            'statistics.totalAmount': 5,
          },
          $set: { 'statistics.lastAppliedDate': expect.any(Date) },
        },
        { new: true },
      );
    });
  });

  describe('addTag', () => {
    it('should add a tag to the fee structure', async () => {
      const id = '507f1f77bcf86cd799439012';
      const tag = 'premium';

      mockFeeStructureModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            ...mockFeeStructure,
            tags: [tag],
          }),
        }),
      });

      const result = await service.addTag(id, tag);

      expect(mockFeeStructureModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        { $addToSet: { tags: tag.trim().toLowerCase() } },
        { new: true },
      );
      expect(result.tags).toContain(tag);
    });
  });

  describe('removeTag', () => {
    it('should remove a tag from the fee structure', async () => {
      const id = '507f1f77bcf86cd799439012';
      const tag = 'premium';

      mockFeeStructureModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            ...mockFeeStructure,
            tags: [],
          }),
        }),
      });

      const result = await service.removeTag(id, tag);

      expect(mockFeeStructureModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        { $pull: { tags: tag.trim().toLowerCase() } },
        { new: true },
      );
      expect(result.tags).not.toContain(tag);
    });
  });

  describe('remove', () => {
    it('should delete a fee structure permanently', async () => {
      const id = '507f1f77bcf86cd799439012';

      mockFeeStructureModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockFeeStructure),
      });

      await service.remove(id);

      expect(mockFeeStructureModel.findByIdAndDelete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when fee structure not found', async () => {
      const id = '507f1f77bcf86cd799439012';

      mockFeeStructureModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a fee structure (deactivate)', async () => {
      const id = '507f1f77bcf86cd799439012';

      mockFeeStructureModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            ...mockFeeStructure,
            isActive: false,
          }),
        }),
      });

      const result = await service.softDelete(id);

      expect(mockFeeStructureModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        { isActive: false },
        { new: true },
      );
      expect(result.isActive).toBe(false);
    });
  });

  describe('getFeeAnalytics', () => {
    it('should return fee analytics', async () => {
      const analyticsData = [
        {
          _id: FeeType.TRANSACTION,
          feeStructureCount: 2,
          totalFeesCollected: 50,
          totalApplications: 20,
          averageFeeAmount: 2.5,
          maxFeeAmount: 5,
          minFeeAmount: 2,
        },
      ];

      const summaryData = [
        {
          _id: null,
          totalFeeStructures: 2,
          activeFeeStructures: 2,
          totalFeesCollected: 50,
          totalApplications: 20,
          averageFeePerStructure: 25,
        },
      ];

      mockFeeStructureModel.aggregate
        .mockResolvedValueOnce(analyticsData)
        .mockResolvedValueOnce(summaryData);

      const result = await service.getFeeAnalytics();

      expect(result).toEqual({
        summary: summaryData[0],
        breakdown: analyticsData,
        groupBy: 'type',
      });
    });
  });
});

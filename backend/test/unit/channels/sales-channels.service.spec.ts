import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SalesChannelsService } from '../../../src/channels/sales-channels.service';
import {
  SalesChannel,
  SalesChannelDocument,
  ChannelType,
  ChannelStatus,
} from '../../../src/channels/schemas/sales-channel.schema';
import { CreateSalesChannelDto } from '../../../src/channels/dto/create-sales-channel.dto';
import { UpdateSalesChannelDto } from '../../../src/channels/dto/update-sales-channel.dto';

describe('SalesChannelsService', () => {
  let service: SalesChannelsService;
  let model: Model<SalesChannelDocument>;

  const mockSalesChannel = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    name: 'Test Online Store',
    code: 'TOS001',
    type: ChannelType.ONLINE,
    status: ChannelStatus.ACTIVE,
    description: 'Test online store channel',
    isActive: true,
    configuration: {
      currency: 'USD',
      timezone: 'UTC',
      language: 'en',
      taxRate: 0.1,
      allowBackorders: false,
      requiresApproval: false,
      autoCalculateShipping: true,
      shippingSettings: {
        freeShippingThreshold: 100,
        defaultShippingCost: 10,
        expeditedShippingCost: 25,
      },
    },
    statistics: {
      totalSales: 0,
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      lastSaleDate: null,
      lastOrderDate: null,
    },
    tags: [],
    integrationSettings: {
      apiKeys: {},
      webhookUrl: '',
      syncEnabled: false,
      lastSyncDate: null,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
  };

  const mockSalesChannelModel = {
    new: jest.fn().mockResolvedValue(mockSalesChannel),
    constructor: jest.fn().mockResolvedValue(mockSalesChannel),
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesChannelsService,
        {
          provide: getModelToken(SalesChannel.name),
          useValue: mockSalesChannelModel,
        },
      ],
    }).compile();

    service = module.get<SalesChannelsService>(SalesChannelsService);
    model = module.get<Model<SalesChannelDocument>>(getModelToken(SalesChannel.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a sales channel successfully', async () => {
      const createDto: CreateSalesChannelDto = {
        name: 'Test Online Store',
        code: 'TOS001',
        type: ChannelType.ONLINE,
        description: 'Test online store channel',
        configuration: {
          currency: 'USD',
          timezone: 'UTC',
          language: 'en',
          taxRate: 0.1,
          allowBackorders: false,
          requiresApproval: false,
          autoCalculateShipping: true,
          shippingSettings: {
            freeShippingThreshold: 100,
            defaultShippingCost: 10,
            expeditedShippingCost: 25,
          },
        },
      };

      const saveSpy = jest.spyOn(mockSalesChannel, 'save').mockResolvedValue(mockSalesChannel);
      jest.spyOn(model, 'constructor' as any).mockImplementation(() => mockSalesChannel);

      const result = await service.create(createDto);

      expect(saveSpy).toHaveBeenCalled();
      expect(result).toEqual(mockSalesChannel);
    });

    it('should throw ConflictException when channel code already exists', async () => {
      const createDto: CreateSalesChannelDto = {
        name: 'Test Store',
        code: 'EXISTING',
        type: ChannelType.ONLINE,
        configuration: {
          currency: 'USD',
          timezone: 'UTC',
          language: 'en',
        },
      };

      const duplicateError = { code: 11000, keyPattern: { code: 1 } };
      jest.spyOn(mockSalesChannel, 'save').mockRejectedValue(duplicateError);
      jest.spyOn(model, 'constructor' as any).mockImplementation(() => mockSalesChannel);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated sales channels', async () => {
      const channels = [mockSalesChannel];
      const total = 1;

      mockSalesChannelModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(channels),
            }),
          }),
        }),
      });

      mockSalesChannelModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(total),
      });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        channels,
        total,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter channels by type', async () => {
      const channels = [mockSalesChannel];
      const total = 1;

      mockSalesChannelModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(channels),
            }),
          }),
        }),
      });

      mockSalesChannelModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(total),
      });

      await service.findAll({ type: ChannelType.ONLINE });

      expect(mockSalesChannelModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ type: ChannelType.ONLINE }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a sales channel by ID', async () => {
      const id = '507f1f77bcf86cd799439011';

      mockSalesChannelModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSalesChannel),
      });

      const result = await service.findOne(id);

      expect(mockSalesChannelModel.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockSalesChannel);
    });

    it('should throw BadRequestException for invalid ID', async () => {
      const invalidId = 'invalid-id';

      await expect(service.findOne(invalidId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when channel not found', async () => {
      const id = '507f1f77bcf86cd799439011';

      mockSalesChannelModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should return a sales channel by code', async () => {
      const code = 'TOS001';

      mockSalesChannelModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSalesChannel),
      });

      const result = await service.findByCode(code);

      expect(mockSalesChannelModel.findOne).toHaveBeenCalledWith({
        code: code.toUpperCase(),
      });
      expect(result).toEqual(mockSalesChannel);
    });
  });

  describe('update', () => {
    it('should update a sales channel successfully', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateSalesChannelDto = {
        name: 'Updated Store',
        description: 'Updated description',
      };

      mockSalesChannelModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockSalesChannel, ...updateDto }),
      });

      const result = await service.update(id, updateDto);

      expect(mockSalesChannelModel.findByIdAndUpdate).toHaveBeenCalledWith(id, updateDto, {
        new: true,
        runValidators: true,
      });
      expect(result.name).toBe('Updated Store');
    });

    it('should throw NotFoundException when channel not found', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updateDto: UpdateSalesChannelDto = { name: 'Updated Store' };

      mockSalesChannelModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update(id, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update channel status successfully', async () => {
      const id = '507f1f77bcf86cd799439011';
      const status = ChannelStatus.INACTIVE;

      mockSalesChannelModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockSalesChannel, status }),
      });

      const result = await service.updateStatus(id, status);

      expect(mockSalesChannelModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        { status },
        { new: true },
      );
      expect(result.status).toBe(status);
    });
  });

  describe('updateStatistics', () => {
    it('should update channel statistics successfully', async () => {
      const id = '507f1f77bcf86cd799439011';
      const updates = {
        totalSales: 10,
        totalOrders: 5,
        totalRevenue: 1000,
      };

      mockSalesChannelModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSalesChannel),
      });

      mockSalesChannelModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockSalesChannel,
          statistics: { ...mockSalesChannel.statistics, ...updates },
        }),
      });

      const result = await service.updateStatistics(id, updates);

      expect(result.statistics.totalSales).toBe(10);
      expect(result.statistics.totalOrders).toBe(5);
      expect(result.statistics.totalRevenue).toBe(1000);
    });
  });

  describe('incrementStatistics', () => {
    it('should increment channel statistics successfully', async () => {
      const id = '507f1f77bcf86cd799439011';
      const increments = { sales: 2, orders: 1, revenue: 200 };

      const updatedChannel = {
        ...mockSalesChannel,
        statistics: {
          ...mockSalesChannel.statistics,
          totalSales: 2,
          totalOrders: 1,
          totalRevenue: 200,
        },
        save: jest.fn().mockResolvedValue(this),
      };

      mockSalesChannelModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedChannel),
      });

      const result = await service.incrementStatistics(id, increments);

      expect(mockSalesChannelModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        {
          $inc: {
            'statistics.totalSales': 2,
            'statistics.totalOrders': 1,
            'statistics.totalRevenue': 200,
          },
          $set: { 'statistics.lastSaleDate': expect.any(Date) },
        },
        { new: true },
      );
    });
  });

  describe('addTag', () => {
    it('should add a tag to the channel', async () => {
      const id = '507f1f77bcf86cd799439011';
      const tag = 'premium';

      mockSalesChannelModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockSalesChannel,
          tags: [tag],
        }),
      });

      const result = await service.addTag(id, tag);

      expect(mockSalesChannelModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        { $addToSet: { tags: tag.trim().toLowerCase() } },
        { new: true },
      );
      expect(result.tags).toContain(tag);
    });
  });

  describe('removeTag', () => {
    it('should remove a tag from the channel', async () => {
      const id = '507f1f77bcf86cd799439011';
      const tag = 'premium';

      mockSalesChannelModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockSalesChannel,
          tags: [],
        }),
      });

      const result = await service.removeTag(id, tag);

      expect(mockSalesChannelModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        { $pull: { tags: tag.trim().toLowerCase() } },
        { new: true },
      );
      expect(result.tags).not.toContain(tag);
    });
  });

  describe('remove', () => {
    it('should delete a channel permanently', async () => {
      const id = '507f1f77bcf86cd799439011';

      mockSalesChannelModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSalesChannel),
      });

      await service.remove(id);

      expect(mockSalesChannelModel.findByIdAndDelete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when channel not found', async () => {
      const id = '507f1f77bcf86cd799439011';

      mockSalesChannelModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a channel (deactivate)', async () => {
      const id = '507f1f77bcf86cd799439011';

      mockSalesChannelModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockSalesChannel,
          isActive: false,
        }),
      });

      const result = await service.softDelete(id);

      expect(mockSalesChannelModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        { isActive: false },
        { new: true },
      );
      expect(result.isActive).toBe(false);
    });
  });

  describe('getChannelAnalytics', () => {
    it('should return channel analytics', async () => {
      const analyticsData = [
        {
          _id: ChannelType.ONLINE,
          channelCount: 2,
          totalRevenue: 2000,
          totalOrders: 20,
          totalSales: 40,
          averageRevenue: 1000,
          averageOrders: 10,
        },
      ];

      const summaryData = [
        {
          _id: null,
          totalChannels: 2,
          activeChannels: 2,
          totalRevenue: 2000,
          totalOrders: 20,
          totalSales: 40,
          averageRevenuePerChannel: 1000,
        },
      ];

      mockSalesChannelModel.aggregate
        .mockResolvedValueOnce(analyticsData)
        .mockResolvedValueOnce(summaryData);

      const result = await service.getChannelAnalytics();

      expect(result).toEqual({
        summary: summaryData[0],
        breakdown: analyticsData,
        groupBy: 'type',
      });
    });
  });

  describe('getTopPerformingChannels', () => {
    it('should return top performing channels', async () => {
      const channels = [mockSalesChannel];

      mockSalesChannelModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(channels),
          }),
        }),
      });

      const result = await service.getTopPerformingChannels(5);

      expect(mockSalesChannelModel.find).toHaveBeenCalledWith({
        isActive: true,
        status: ChannelStatus.ACTIVE,
      });
      expect(result).toEqual(channels);
    });
  });

  describe('getChannelsByType', () => {
    it('should return channels by type', async () => {
      const channels = [mockSalesChannel];

      mockSalesChannelModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(channels),
        }),
      });

      const result = await service.getChannelsByType(ChannelType.ONLINE);

      expect(mockSalesChannelModel.find).toHaveBeenCalledWith({
        type: ChannelType.ONLINE,
        isActive: true,
      });
      expect(result).toEqual(channels);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { MilkPurchasesService } from './milk-purchases.service';
import { MilkPurchasesRepository } from './milk-purchases.repository';
import { VendorsService } from '../vendors/vendors.service';
import { Role } from '../users/user.entity';

const mockUser = { id: 'user-1', role: Role.OWNER, fullName: 'Owner' } as any;
const mockVendor = { id: 'vendor-1', name: 'Farm A', defaultRate: 80 } as any;

describe('MilkPurchasesService', () => {
  let service: MilkPurchasesService;
  let repo: jest.Mocked<MilkPurchasesRepository>;
  let vendorsService: jest.Mocked<VendorsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MilkPurchasesService,
        {
          provide: MilkPurchasesRepository,
          useValue: {
            findByVendorAndDate: jest.fn(),
            save: jest.fn(),
            findById: jest.fn(),
            findByDateRange: jest.fn(),
            findByMonthAndVendor: jest.fn(),
          },
        },
        {
          provide: VendorsService,
          useValue: { findById: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<MilkPurchasesService>(MilkPurchasesService);
    repo = module.get(MilkPurchasesRepository);
    vendorsService = module.get(VendorsService);
  });

  describe('create', () => {
    const today = new Date().toISOString().split('T')[0];

    it('should create purchase and auto-calculate totalAmount', async () => {
      vendorsService.findById.mockResolvedValue(mockVendor);
      repo.findByVendorAndDate.mockResolvedValue(null);
      repo.save.mockResolvedValue({
        id: 'p-1',
        quantityLiters: 100,
        ratePerLiter: 85,
        totalAmount: 8500,
      } as any);

      const result = await service.create(
        { vendorId: 'vendor-1', purchaseDate: today, quantityLiters: 100, ratePerLiter: 85 },
        mockUser,
      );

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ totalAmount: 8500 }),
      );
    });

    it('should throw when date is in the future', async () => {
      await expect(
        service.create(
          { vendorId: 'vendor-1', purchaseDate: '2030-01-01', quantityLiters: 10, ratePerLiter: 80 },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException on duplicate vendor+date', async () => {
      vendorsService.findById.mockResolvedValue(mockVendor);
      repo.findByVendorAndDate.mockResolvedValue({ id: 'existing' } as any);

      await expect(
        service.create(
          { vendorId: 'vendor-1', purchaseDate: today, quantityLiters: 50, ratePerLiter: 80 },
          mockUser,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should validate quantityLiters > 0', async () => {
      await expect(
        service.create(
          { vendorId: 'vendor-1', purchaseDate: today, quantityLiters: 0, ratePerLiter: 80 },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate ratePerLiter > 0', async () => {
      await expect(
        service.create(
          { vendorId: 'vendor-1', purchaseDate: today, quantityLiters: 50, ratePerLiter: -5 },
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

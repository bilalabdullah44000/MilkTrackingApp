import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { MilkPurchase } from '../milk-purchases/milk-purchase.entity';
import { MilkDelivery } from '../milk-deliveries/milk-delivery.entity';

const mockQueryBuilder = (rawResult: any) => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  getRawOne: jest.fn().mockResolvedValue(rawResult),
});

describe('DashboardService', () => {
  let service: DashboardService;

  const purchasesRepo = {
    createQueryBuilder: jest.fn(),
  };
  const deliveriesRepo = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(MilkPurchase), useValue: purchasesRepo },
        { provide: getRepositoryToken(MilkDelivery), useValue: deliveriesRepo },
      ],
    }).compile();
    service = module.get<DashboardService>(DashboardService);
  });

  it('should calculate stats correctly', async () => {
    purchasesRepo.createQueryBuilder.mockReturnValue(
      mockQueryBuilder({ totalLiters: '150.5', totalAmount: '12750.00' }),
    );
    deliveriesRepo.createQueryBuilder.mockReturnValue(
      mockQueryBuilder({ totalLiters: '120.0', totalAmount: '13200.00' }),
    );

    const stats = await service.getStats('2026-06-01', '2026-06-30');

    expect(stats.milkPurchasedLiters).toBe(150.5);
    expect(stats.milkSuppliedLiters).toBe(120.0);
    expect(stats.revenue).toBe(13200.0);
    expect(stats.cost).toBe(12750.0);
    expect(stats.profit).toBe(450.0);
  });

  it('should return zeros when no data', async () => {
    purchasesRepo.createQueryBuilder.mockReturnValue(
      mockQueryBuilder({ totalLiters: '0', totalAmount: '0' }),
    );
    deliveriesRepo.createQueryBuilder.mockReturnValue(
      mockQueryBuilder({ totalLiters: '0', totalAmount: '0' }),
    );

    const stats = await service.getStats('2026-06-01', '2026-06-30');

    expect(stats.milkPurchasedLiters).toBe(0);
    expect(stats.milkSuppliedLiters).toBe(0);
    expect(stats.revenue).toBe(0);
    expect(stats.cost).toBe(0);
    expect(stats.profit).toBe(0);
  });

  it('should calculate profit correctly when cost exceeds revenue', async () => {
    purchasesRepo.createQueryBuilder.mockReturnValue(
      mockQueryBuilder({ totalLiters: '200', totalAmount: '20000' }),
    );
    deliveriesRepo.createQueryBuilder.mockReturnValue(
      mockQueryBuilder({ totalLiters: '150', totalAmount: '15000' }),
    );

    const stats = await service.getStats('2026-06-01', '2026-06-30');
    expect(stats.profit).toBe(-5000);
  });
});

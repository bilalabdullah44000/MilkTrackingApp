import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { MilkPurchasesService } from '../milk-purchases/milk-purchases.service';
import { MilkDeliveriesService } from '../milk-deliveries/milk-deliveries.service';
import { VendorsService } from '../vendors/vendors.service';
import { CustomersService } from '../customers/customers.service';

const mockVendor = { id: 'vendor-1', name: 'Test Farm' };
const mockCustomer = { id: 'customer-1', name: 'Test Customer' };

const makePurchases = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    purchaseDate: `2026-06-${String(i + 1).padStart(2, '0')}`,
    quantityLiters: 100,
    ratePerLiter: 80,
    totalAmount: 8000,
  }));

const makeDeliveries = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    deliveryDate: `2026-06-${String(i + 1).padStart(2, '0')}`,
    quantityLiters: 50,
    ratePerLiter: 110,
    totalAmount: 5500,
  }));

describe('BillingService', () => {
  let service: BillingService;
  let purchasesService: jest.Mocked<MilkPurchasesService>;
  let deliveriesService: jest.Mocked<MilkDeliveriesService>;
  let vendorsService: jest.Mocked<VendorsService>;
  let customersService: jest.Mocked<CustomersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: MilkPurchasesService,
          useValue: { findByMonthAndVendor: jest.fn() },
        },
        {
          provide: MilkDeliveriesService,
          useValue: { findByMonthAndCustomer: jest.fn() },
        },
        {
          provide: VendorsService,
          useValue: { findById: jest.fn() },
        },
        {
          provide: CustomersService,
          useValue: { findById: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    purchasesService = module.get(MilkPurchasesService);
    deliveriesService = module.get(MilkDeliveriesService);
    vendorsService = module.get(VendorsService);
    customersService = module.get(CustomersService);
  });

  describe('getMonthlyVendorBill', () => {
    it('should calculate aggregates correctly', async () => {
      vendorsService.findById.mockResolvedValue(mockVendor as any);
      purchasesService.findByMonthAndVendor.mockResolvedValue(makePurchases(5) as any);

      const statement = await service.getMonthlyVendorBill('vendor-1', 6, 2026);

      expect(statement.entityName).toBe('Test Farm');
      expect(statement.totalLiters).toBe(500);
      expect(statement.totalDays).toBe(5);
      expect(statement.totalAmount).toBe(40000);
      expect(statement.averageRate).toBe(80);
    });

    it('should return correct month name', async () => {
      vendorsService.findById.mockResolvedValue(mockVendor as any);
      purchasesService.findByMonthAndVendor.mockResolvedValue([]);

      const statement = await service.getMonthlyVendorBill('vendor-1', 3, 2026);
      expect(statement.month).toBe('March');
    });

    it('should return zero averageRate when no transactions', async () => {
      vendorsService.findById.mockResolvedValue(mockVendor as any);
      purchasesService.findByMonthAndVendor.mockResolvedValue([]);

      const statement = await service.getMonthlyVendorBill('vendor-1', 6, 2026);
      expect(statement.averageRate).toBe(0);
      expect(statement.totalLiters).toBe(0);
    });
  });

  describe('getMonthlyCustomerInvoice', () => {
    it('should calculate invoice aggregates correctly', async () => {
      customersService.findById.mockResolvedValue(mockCustomer as any);
      deliveriesService.findByMonthAndCustomer.mockResolvedValue(makeDeliveries(10) as any);

      const invoice = await service.getMonthlyCustomerInvoice('customer-1', 6, 2026);

      expect(invoice.entityName).toBe('Test Customer');
      expect(invoice.totalDays).toBe(10);
      expect(invoice.totalLiters).toBe(500);
      expect(invoice.totalAmount).toBe(55000);
      expect(invoice.averageRate).toBe(110);
    });
  });
});

import { Injectable } from '@nestjs/common';
import { MilkPurchasesService } from '../milk-purchases/milk-purchases.service';
import { MilkDeliveriesService } from '../milk-deliveries/milk-deliveries.service';
import { VendorsService } from '../vendors/vendors.service';
import { CustomersService } from '../customers/customers.service';
import { MonthlyStatement, TransactionDetail } from './dto/billing.dto';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

@Injectable()
export class BillingService {
  constructor(
    private readonly purchasesService: MilkPurchasesService,
    private readonly deliveriesService: MilkDeliveriesService,
    private readonly vendorsService: VendorsService,
    private readonly customersService: CustomersService,
  ) {}

  async getMonthlyVendorBill(vendorId: string, month: number, year: number): Promise<MonthlyStatement> {
    const [vendor, purchases] = await Promise.all([
      this.vendorsService.findById(vendorId),
      this.purchasesService.findByMonthAndVendor(vendorId, year, month),
    ]);

    const transactions: TransactionDetail[] = purchases.map((p) => ({
      date: p.purchaseDate,
      quantityLiters: parseFloat(String(p.quantityLiters)),
      ratePerLiter: parseFloat(String(p.ratePerLiter)),
      amount: parseFloat(String(p.totalAmount)),
    }));

    const totalLiters = transactions.reduce((sum, t) => sum + t.quantityLiters, 0);
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const averageRate = totalLiters > 0 ? totalAmount / totalLiters : 0;

    return {
      entityId: vendorId,
      entityName: vendor.name,
      month: MONTH_NAMES[month - 1],
      year,
      transactions,
      totalLiters: parseFloat(totalLiters.toFixed(1)),
      totalDays: transactions.length,
      averageRate: parseFloat(averageRate.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    };
  }

  async getMonthlyCustomerInvoice(
    customerId: string,
    month: number,
    year: number,
  ): Promise<MonthlyStatement> {
    const [customer, deliveries] = await Promise.all([
      this.customersService.findById(customerId),
      this.deliveriesService.findByMonthAndCustomer(customerId, year, month),
    ]);

    const transactions: TransactionDetail[] = deliveries.map((d) => ({
      date: d.deliveryDate,
      quantityLiters: parseFloat(String(d.quantityLiters)),
      ratePerLiter: parseFloat(String(d.ratePerLiter)),
      amount: parseFloat(String(d.totalAmount)),
    }));

    const totalLiters = transactions.reduce((sum, t) => sum + t.quantityLiters, 0);
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const averageRate = totalLiters > 0 ? totalAmount / totalLiters : 0;

    return {
      entityId: customerId,
      entityName: customer.name,
      month: MONTH_NAMES[month - 1],
      year,
      transactions,
      totalLiters: parseFloat(totalLiters.toFixed(1)),
      totalDays: transactions.length,
      averageRate: parseFloat(averageRate.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    };
  }
}

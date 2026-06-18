import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MilkPurchase } from '../milk-purchases/milk-purchase.entity';
import { MilkDelivery } from '../milk-deliveries/milk-delivery.entity';
import { DashboardStats } from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(MilkPurchase)
    private readonly purchasesRepo: Repository<MilkPurchase>,
    @InjectRepository(MilkDelivery)
    private readonly deliveriesRepo: Repository<MilkDelivery>,
  ) {}

  async getStats(startDate: string, endDate: string): Promise<DashboardStats> {
    const [purchaseResult, deliveryResult] = await Promise.all([
      this.purchasesRepo
        .createQueryBuilder('mp')
        .select('COALESCE(SUM(mp.quantity_liters), 0)', 'totalLiters')
        .addSelect('COALESCE(SUM(mp.total_amount), 0)', 'totalAmount')
        .where('mp.purchase_date BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getRawOne(),
      this.deliveriesRepo
        .createQueryBuilder('md')
        .select('COALESCE(SUM(md.quantity_liters), 0)', 'totalLiters')
        .addSelect('COALESCE(SUM(md.total_amount), 0)', 'totalAmount')
        .where('md.delivery_date BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getRawOne(),
    ]);

    const cost = parseFloat(purchaseResult?.totalAmount || '0');
    const revenue = parseFloat(deliveryResult?.totalAmount || '0');

    return {
      milkPurchasedLiters: parseFloat(purchaseResult?.totalLiters || '0'),
      milkSuppliedLiters: parseFloat(deliveryResult?.totalLiters || '0'),
      revenue,
      cost,
      profit: parseFloat((revenue - cost).toFixed(2)),
    };
  }
}

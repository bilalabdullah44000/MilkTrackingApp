import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MilkPurchase } from './milk-purchase.entity';

export interface PurchasesPage {
  items: MilkPurchase[];
  total: number;
  totalLiters: number;
  totalCost: number;
}

@Injectable()
export class MilkPurchasesRepository {
  constructor(
    @InjectRepository(MilkPurchase)
    private readonly repo: Repository<MilkPurchase>,
  ) {}

  async findByDateRange(
    startDate: string,
    endDate: string,
    vendorIds?: string[],
    limit = 20,
    offset = 0,
  ): Promise<PurchasesPage> {
    const qb = this.repo
      .createQueryBuilder('mp')
      .leftJoinAndSelect('mp.vendor', 'vendor')
      .leftJoinAndSelect('mp.createdBy', 'createdBy')
      .leftJoinAndSelect('mp.updatedBy', 'updatedBy')
      .where('mp.purchase_date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('mp.purchase_date', 'DESC');

    if (vendorIds && vendorIds.length > 0) {
      qb.andWhere('mp.vendor_id IN (:...vendorIds)', { vendorIds });
    }

    const total = await qb.clone().getCount();

    const aggQb = this.repo
      .createQueryBuilder('mp')
      .select('COALESCE(SUM(mp.quantity_liters), 0)', 'totalLiters')
      .addSelect('COALESCE(SUM(mp.total_amount), 0)', 'totalCost')
      .where('mp.purchase_date BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (vendorIds && vendorIds.length > 0) {
      aggQb.andWhere('mp.vendor_id IN (:...vendorIds)', { vendorIds });
    }

    const agg = await aggQb.getRawOne();

    const items = await qb.clone().skip(offset).take(limit).getMany();

    return {
      items,
      total,
      totalLiters: parseFloat(agg.totalLiters),
      totalCost: parseFloat(agg.totalCost),
    };
  }

  findById(id: string): Promise<MilkPurchase | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['vendor', 'createdBy', 'updatedBy'],
    });
  }

  findByVendorAndDate(vendorId: string, purchaseDate: string): Promise<MilkPurchase | null> {
    return this.repo
      .createQueryBuilder('mp')
      .where('mp.vendor_id = :vendorId', { vendorId })
      .andWhere('mp.purchase_date = :purchaseDate', { purchaseDate })
      .getOne();
  }

  save(purchase: Partial<MilkPurchase>): Promise<MilkPurchase> {
    return this.repo.save(purchase);
  }

  delete(id: string): Promise<void> {
    return this.repo.delete(id).then(() => undefined);
  }

  findByMonthAndVendor(vendorId: string, year: number, month: number): Promise<MilkPurchase[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    return this.repo
      .createQueryBuilder('mp')
      .leftJoinAndSelect('mp.vendor', 'vendor')
      .where('mp.vendor_id = :vendorId', { vendorId })
      .andWhere('mp.purchase_date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('mp.purchase_date', 'ASC')
      .getMany();
  }
}

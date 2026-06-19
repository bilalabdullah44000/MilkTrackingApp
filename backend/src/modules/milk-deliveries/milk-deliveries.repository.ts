import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MilkDelivery } from './milk-delivery.entity';

export interface DeliveriesPage {
  items: MilkDelivery[];
  total: number;
  totalLiters: number;
  totalRevenue: number;
}

@Injectable()
export class MilkDeliveriesRepository {
  constructor(
    @InjectRepository(MilkDelivery)
    private readonly repo: Repository<MilkDelivery>,
    private readonly dataSource: DataSource,
  ) {}

  async findByDateRange(
    startDate: string,
    endDate: string,
    customerIds?: string[],
    limit = 20,
    offset = 0,
  ): Promise<DeliveriesPage> {
    const qb = this.repo
      .createQueryBuilder('md')
      .leftJoinAndSelect('md.customer', 'customer')
      .leftJoinAndSelect('md.createdBy', 'createdBy')
      .leftJoinAndSelect('md.updatedBy', 'updatedBy')
      .where('md.delivery_date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('md.deliveryDate', 'DESC');

    if (customerIds && customerIds.length > 0) {
      qb.andWhere('md.customer_id IN (:...customerIds)', { customerIds });
    }

    const total = await qb.clone().getCount();

    const aggQb = this.repo
      .createQueryBuilder('md')
      .select('COALESCE(SUM(md.quantity_liters), 0)', 'totalLiters')
      .addSelect('COALESCE(SUM(md.total_amount), 0)', 'totalRevenue')
      .where('md.delivery_date BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (customerIds && customerIds.length > 0) {
      aggQb.andWhere('md.customer_id IN (:...customerIds)', { customerIds });
    }

    const agg = await aggQb.getRawOne();

    const items = await qb.clone().skip(offset).take(limit).getMany();

    return {
      items,
      total,
      totalLiters: parseFloat(agg.totalLiters),
      totalRevenue: parseFloat(agg.totalRevenue),
    };
  }

  findById(id: string): Promise<MilkDelivery | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['customer', 'createdBy', 'updatedBy'],
    });
  }

  findByCustomerAndDate(customerId: string, deliveryDate: string): Promise<MilkDelivery | null> {
    return this.repo
      .createQueryBuilder('md')
      .where('md.customer_id = :customerId', { customerId })
      .andWhere('md.delivery_date = :deliveryDate', { deliveryDate })
      .getOne();
  }

  save(delivery: Partial<MilkDelivery>): Promise<MilkDelivery> {
    return this.repo.save(delivery);
  }

  delete(id: string): Promise<void> {
    return this.repo.delete(id).then(() => undefined);
  }

  findByMonthAndCustomer(customerId: string, year: number, month: number): Promise<MilkDelivery[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    return this.repo
      .createQueryBuilder('md')
      .leftJoinAndSelect('md.customer', 'customer')
      .where('md.customer_id = :customerId', { customerId })
      .andWhere('md.delivery_date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('md.deliveryDate', 'ASC')
      .getMany();
  }

  async saveBulk(
    deliveries: Partial<MilkDelivery>[],
  ): Promise<{ saved: MilkDelivery[]; errors: Array<{ customerId: string; reason: string }> }> {
    const saved: MilkDelivery[] = [];
    const errors: Array<{ customerId: string; reason: string }> = [];

    await this.dataSource.transaction(async (manager) => {
      for (const delivery of deliveries) {
        try {
          const existing = await manager
            .createQueryBuilder(MilkDelivery, 'md')
            .where('md.customer_id = :customerId', { customerId: (delivery.customer as any).id })
            .andWhere('md.delivery_date = :deliveryDate', { deliveryDate: delivery.deliveryDate })
            .getOne();

          if (existing) {
            errors.push({
              customerId: (delivery.customer as any).id,
              reason: 'Delivery already exists for this date',
            });
            continue;
          }

          const entity = manager.create(MilkDelivery, delivery);
          const result = await manager.save(entity);
          const full = await manager.findOne(MilkDelivery, {
            where: { id: result.id },
            relations: ['customer', 'createdBy', 'updatedBy'],
          });
          if (full) saved.push(full);
        } catch (err: any) {
          errors.push({
            customerId: (delivery.customer as any).id,
            reason: err.message || 'Unknown error',
          });
        }
      }
    });

    return { saved, errors };
  }
}

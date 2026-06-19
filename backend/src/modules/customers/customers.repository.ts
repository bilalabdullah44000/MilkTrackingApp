import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, BillStatus } from './customer.entity';

@Injectable()
export class CustomersRepository {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
  ) {}

  findAll(activeOnly?: boolean): Promise<Customer[]> {
    const where = activeOnly ? { active: true } : {};
    return this.repo.find({
      where,
      relations: ['createdBy', 'updatedBy'],
      order: { name: 'ASC' },
    });
  }

  findById(id: string): Promise<Customer | null> {
    return this.repo.findOne({ where: { id }, relations: ['createdBy', 'updatedBy'] });
  }

  findByName(name: string): Promise<Customer | null> {
    return this.repo.findOne({ where: { name } });
  }

  save(customer: Partial<Customer>): Promise<Customer> {
    return this.repo.save(customer);
  }

  delete(id: string): Promise<void> {
    return this.repo.delete(id).then(() => undefined);
  }

  findActiveCustomersWithoutDeliveryOnDate(date: string): Promise<Customer[]> {
    return this.repo
      .createQueryBuilder('c')
      .leftJoin('milk_deliveries', 'md', 'md.customer_id = c.id AND md.delivery_date = :date', { date })
      .where('c.active = true')
      .andWhere('md.id IS NULL')
      .orderBy('c.name', 'ASC')
      .getMany();
  }

  async updateAllDefaultRate(defaultRate: number): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .update(Customer)
      .set({ defaultRate })
      .execute();
    return result.affected ?? 0;
  }

  async resetAllBillStatus(): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(Customer)
      .set({ billStatus: BillStatus.UNPAID })
      .execute();
  }
}

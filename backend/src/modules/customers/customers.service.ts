import { Injectable, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CustomersRepository } from './customers.repository';
import { Customer } from './customer.entity';
import { User } from '../users/user.entity';
import { z } from 'zod';

const CustomerSchema = z.object({
  name: z.string().min(1).max(255),
  defaultRate: z.number().positive(),
  notes: z.string().optional(),
  active: z.boolean().optional(),
});

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  findAll(activeOnly?: boolean): Promise<Customer[]> {
    return this.customersRepository.findAll(activeOnly);
  }

  async findById(id: string): Promise<Customer> {
    const customer = await this.customersRepository.findById(id);
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  findPendingForDate(date: string): Promise<Customer[]> {
    return this.customersRepository.findActiveCustomersWithoutDeliveryOnDate(date);
  }

  async create(input: { name: string; defaultRate: number; notes?: string }, user: User): Promise<Customer> {
    const parsed = CustomerSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors[0].message);

    const existing = await this.customersRepository.findByName(parsed.data.name);
    if (existing) throw new ConflictException('Customer name already exists');

    return this.customersRepository.save({
      ...parsed.data,
      createdBy: user,
      updatedBy: user,
    });
  }

  async update(
    id: string,
    input: { name: string; defaultRate: number; notes?: string; active?: boolean },
    user: User,
  ): Promise<Customer> {
    const parsed = CustomerSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors[0].message);

    const customer = await this.findById(id);

    const nameTaken = await this.customersRepository.findByName(parsed.data.name);
    if (nameTaken && nameTaken.id !== id) throw new ConflictException('Customer name already exists');

    return this.customersRepository.save({
      ...customer,
      ...parsed.data,
      updatedBy: user,
    });
  }

  async delete(id: string): Promise<boolean> {
    await this.findById(id);
    try {
      await this.customersRepository.delete(id);
      return true;
    } catch (err: any) {
      if (err.code === '23503') {
        throw new ConflictException('Cannot delete customer with existing delivery records');
      }
      throw new InternalServerErrorException('Failed to delete customer');
    }
  }
}

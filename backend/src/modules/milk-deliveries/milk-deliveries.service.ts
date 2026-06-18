import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { MilkDeliveriesRepository } from './milk-deliveries.repository';
import { MilkDelivery } from './milk-delivery.entity';
import { CustomersService } from '../customers/customers.service';
import { User } from '../users/user.entity';
import { BulkDeliveryResponse } from './dto/milk-delivery.input';
import { z } from 'zod';

const DeliverySchema = z.object({
  customerId: z.string().uuid(),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  quantityLiters: z.number().positive(),
  ratePerLiter: z.number().positive(),
  notes: z.string().optional(),
});

type DeliveryInput = z.infer<typeof DeliverySchema>;

@Injectable()
export class MilkDeliveriesService {
  constructor(
    private readonly repo: MilkDeliveriesRepository,
    private readonly customersService: CustomersService,
  ) {}

  findByDateRange(startDate: string, endDate: string, customerIds?: string[]): Promise<MilkDelivery[]> {
    return this.repo.findByDateRange(startDate, endDate, customerIds);
  }

  async findById(id: string): Promise<MilkDelivery> {
    const delivery = await this.repo.findById(id);
    if (!delivery) throw new NotFoundException('Delivery not found');
    return delivery;
  }

  async create(input: DeliveryInput, user: User): Promise<MilkDelivery> {
    const parsed = DeliverySchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors[0].message);

    const today = new Date().toISOString().split('T')[0];
    if (parsed.data.deliveryDate > today) {
      throw new BadRequestException('Delivery date cannot be in the future');
    }

    const customer = await this.customersService.findById(parsed.data.customerId);

    const existing = await this.repo.findByCustomerAndDate(
      parsed.data.customerId,
      parsed.data.deliveryDate,
    );
    if (existing) {
      throw new ConflictException('A delivery for this customer on this date already exists');
    }

    const totalAmount = parseFloat(
      (parsed.data.quantityLiters * parsed.data.ratePerLiter).toFixed(2),
    );

    return this.repo.save({
      customer,
      deliveryDate: parsed.data.deliveryDate,
      quantityLiters: parsed.data.quantityLiters,
      ratePerLiter: parsed.data.ratePerLiter,
      totalAmount,
      notes: parsed.data.notes,
      createdBy: user,
      updatedBy: user,
    });
  }

  async update(id: string, input: DeliveryInput, user: User): Promise<MilkDelivery> {
    const parsed = DeliverySchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors[0].message);

    const today = new Date().toISOString().split('T')[0];
    if (parsed.data.deliveryDate > today) {
      throw new BadRequestException('Delivery date cannot be in the future');
    }

    const delivery = await this.findById(id);
    const customer = await this.customersService.findById(parsed.data.customerId);

    const existing = await this.repo.findByCustomerAndDate(
      parsed.data.customerId,
      parsed.data.deliveryDate,
    );
    if (existing && existing.id !== id) {
      throw new ConflictException('A delivery for this customer on this date already exists');
    }

    const totalAmount = parseFloat(
      (parsed.data.quantityLiters * parsed.data.ratePerLiter).toFixed(2),
    );

    return this.repo.save({
      ...delivery,
      customer,
      deliveryDate: parsed.data.deliveryDate,
      quantityLiters: parsed.data.quantityLiters,
      ratePerLiter: parsed.data.ratePerLiter,
      totalAmount,
      notes: parsed.data.notes,
      updatedBy: user,
    });
  }

  async createBulk(
    items: DeliveryInput[],
    user: User,
  ): Promise<BulkDeliveryResponse> {
    const today = new Date().toISOString().split('T')[0];
    const preparedDeliveries: any[] = [];
    const validationErrors: Array<{ customerId: string; customerName: string; reason: string }> = [];

    for (const item of items) {
      const parsed = DeliverySchema.safeParse(item);
      if (!parsed.success) {
        validationErrors.push({
          customerId: item.customerId,
          customerName: 'Unknown',
          reason: parsed.error.errors[0].message,
        });
        continue;
      }

      if (parsed.data.deliveryDate > today) {
        validationErrors.push({
          customerId: item.customerId,
          customerName: 'Unknown',
          reason: 'Delivery date cannot be in the future',
        });
        continue;
      }

      try {
        const customer = await this.customersService.findById(parsed.data.customerId);
        const totalAmount = parseFloat(
          (parsed.data.quantityLiters * parsed.data.ratePerLiter).toFixed(2),
        );
        preparedDeliveries.push({
          customer,
          deliveryDate: parsed.data.deliveryDate,
          quantityLiters: parsed.data.quantityLiters,
          ratePerLiter: parsed.data.ratePerLiter,
          totalAmount,
          notes: parsed.data.notes,
          createdBy: user,
          updatedBy: user,
        });
      } catch {
        validationErrors.push({
          customerId: item.customerId,
          customerName: 'Unknown',
          reason: 'Customer not found',
        });
      }
    }

    const { saved, errors } = await this.repo.saveBulk(preparedDeliveries);

    const allErrors = [
      ...validationErrors,
      ...errors.map((e) => ({
        customerId: e.customerId,
        customerName: preparedDeliveries.find((d) => d.customer.id === e.customerId)?.customer.name || 'Unknown',
        reason: e.reason,
      })),
    ];

    return {
      successCount: saved.length,
      failedCount: allErrors.length,
      createdDeliveries: saved,
      errors: allErrors,
    };
  }

  async delete(id: string): Promise<boolean> {
    await this.findById(id);
    await this.repo.delete(id);
    return true;
  }

  findByMonthAndCustomer(customerId: string, year: number, month: number): Promise<MilkDelivery[]> {
    return this.repo.findByMonthAndCustomer(customerId, year, month);
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { MilkPurchasesRepository } from './milk-purchases.repository';
import { MilkPurchase } from './milk-purchase.entity';
import { VendorsService } from '../vendors/vendors.service';
import { User } from '../users/user.entity';
import { z } from 'zod';

const PurchaseSchema = z.object({
  vendorId: z.string().uuid(),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  quantityLiters: z.number().positive(),
  ratePerLiter: z.number().positive(),
  notes: z.string().optional(),
});

type PurchaseInput = z.infer<typeof PurchaseSchema>;

@Injectable()
export class MilkPurchasesService {
  constructor(
    private readonly repo: MilkPurchasesRepository,
    private readonly vendorsService: VendorsService,
  ) {}

  findByDateRange(startDate: string, endDate: string, vendorIds?: string[], limit = 20, offset = 0) {
    return this.repo.findByDateRange(startDate, endDate, vendorIds, limit, offset);
  }

  async findById(id: string): Promise<MilkPurchase> {
    const purchase = await this.repo.findById(id);
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }

  async create(input: PurchaseInput, user: User): Promise<MilkPurchase> {
    const parsed = PurchaseSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors[0].message);

    const today = new Date().toISOString().split('T')[0];
    if (parsed.data.purchaseDate > today) {
      throw new BadRequestException('Purchase date cannot be in the future');
    }

    const vendor = await this.vendorsService.findById(parsed.data.vendorId);

    const existing = await this.repo.findByVendorAndDate(parsed.data.vendorId, parsed.data.purchaseDate);
    if (existing) {
      throw new ConflictException('A purchase for this vendor on this date already exists');
    }

    const totalAmount = parseFloat(
      (parsed.data.quantityLiters * parsed.data.ratePerLiter).toFixed(2),
    );

    return this.repo.save({
      vendor,
      purchaseDate: parsed.data.purchaseDate,
      quantityLiters: parsed.data.quantityLiters,
      ratePerLiter: parsed.data.ratePerLiter,
      totalAmount,
      notes: parsed.data.notes,
      createdBy: user,
      updatedBy: user,
    });
  }

  async update(id: string, input: PurchaseInput, user: User): Promise<MilkPurchase> {
    const parsed = PurchaseSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors[0].message);

    const today = new Date().toISOString().split('T')[0];
    if (parsed.data.purchaseDate > today) {
      throw new BadRequestException('Purchase date cannot be in the future');
    }

    const purchase = await this.findById(id);
    const vendor = await this.vendorsService.findById(parsed.data.vendorId);

    const existing = await this.repo.findByVendorAndDate(parsed.data.vendorId, parsed.data.purchaseDate);
    if (existing && existing.id !== id) {
      throw new ConflictException('A purchase for this vendor on this date already exists');
    }

    const totalAmount = parseFloat(
      (parsed.data.quantityLiters * parsed.data.ratePerLiter).toFixed(2),
    );

    return this.repo.save({
      ...purchase,
      vendor,
      purchaseDate: parsed.data.purchaseDate,
      quantityLiters: parsed.data.quantityLiters,
      ratePerLiter: parsed.data.ratePerLiter,
      totalAmount,
      notes: parsed.data.notes,
      updatedBy: user,
    });
  }

  async delete(id: string): Promise<boolean> {
    await this.findById(id);
    await this.repo.delete(id);
    return true;
  }

  findByMonthAndVendor(vendorId: string, year: number, month: number): Promise<MilkPurchase[]> {
    return this.repo.findByMonthAndVendor(vendorId, year, month);
  }
}

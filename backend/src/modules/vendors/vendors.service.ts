import { Injectable, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { VendorsRepository } from './vendors.repository';
import { Vendor } from './vendor.entity';
import { User } from '../users/user.entity';
import { z } from 'zod';

const VendorSchema = z.object({
  name: z.string().min(1).max(255),
  defaultRate: z.number().positive(),
  notes: z.string().optional(),
  active: z.boolean().optional(),
});

@Injectable()
export class VendorsService {
  constructor(private readonly vendorsRepository: VendorsRepository) {}

  findAll(activeOnly?: boolean): Promise<Vendor[]> {
    return this.vendorsRepository.findAll(activeOnly);
  }

  async findById(id: string): Promise<Vendor> {
    const vendor = await this.vendorsRepository.findById(id);
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async create(input: { name: string; defaultRate: number; notes?: string }, user: User): Promise<Vendor> {
    const parsed = VendorSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors[0].message);

    const existing = await this.vendorsRepository.findByName(parsed.data.name);
    if (existing) throw new ConflictException('Vendor name already exists');

    return this.vendorsRepository.save({
      ...parsed.data,
      createdBy: user,
      updatedBy: user,
    });
  }

  async update(
    id: string,
    input: { name: string; defaultRate: number; notes?: string; active?: boolean },
    user: User,
  ): Promise<Vendor> {
    const parsed = VendorSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.errors[0].message);

    const vendor = await this.findById(id);

    const nameTaken = await this.vendorsRepository.findByName(parsed.data.name);
    if (nameTaken && nameTaken.id !== id) throw new ConflictException('Vendor name already exists');

    return this.vendorsRepository.save({
      ...vendor,
      ...parsed.data,
      updatedBy: user,
    });
  }

  async delete(id: string): Promise<boolean> {
    await this.findById(id);
    try {
      await this.vendorsRepository.delete(id);
      return true;
    } catch (err: any) {
      if (err.code === '23503') {
        throw new ConflictException('Cannot delete vendor with existing purchase records');
      }
      throw new InternalServerErrorException('Failed to delete vendor');
    }
  }
}

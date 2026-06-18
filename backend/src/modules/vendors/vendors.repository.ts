import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from './vendor.entity';

@Injectable()
export class VendorsRepository {
  constructor(
    @InjectRepository(Vendor)
    private readonly repo: Repository<Vendor>,
  ) {}

  findAll(activeOnly?: boolean): Promise<Vendor[]> {
    const where = activeOnly ? { active: true } : {};
    return this.repo.find({
      where,
      relations: ['createdBy', 'updatedBy'],
      order: { name: 'ASC' },
    });
  }

  findById(id: string): Promise<Vendor | null> {
    return this.repo.findOne({ where: { id }, relations: ['createdBy', 'updatedBy'] });
  }

  save(vendor: Partial<Vendor>): Promise<Vendor> {
    return this.repo.save(vendor);
  }

  findByName(name: string): Promise<Vendor | null> {
    return this.repo.findOne({ where: { name } });
  }

  delete(id: string): Promise<void> {
    return this.repo.delete(id).then(() => undefined);
  }
}

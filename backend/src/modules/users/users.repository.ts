import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.repo.find({ order: { fullName: 'ASC' } });
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  findByFullName(fullName: string): Promise<User | null> {
    return this.repo.findOne({ where: { fullName } });
  }

  save(user: Partial<User>): Promise<User> {
    return this.repo.save(user);
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    await this.repo.update(id, updates);
    return this.findById(id);
  }
}

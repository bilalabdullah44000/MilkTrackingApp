import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User, Role } from './user.entity';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';

const CreateUserSchema = z.object({
  fullName: z.string().min(2).max(200),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(Role),
});

type CreateUserInput = z.infer<typeof CreateUserSchema>;

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.findAll();
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async create(input: CreateUserInput): Promise<User> {
    const parsed = CreateUserSchema.parse(input);

    const existing = await this.usersRepository.findByEmail(parsed.email);
    if (existing) throw new ConflictException('Email already in use');

    const nameTaken = await this.usersRepository.findByFullName(parsed.fullName);
    if (nameTaken) throw new ConflictException('Full name already in use');

    const passwordHash = await bcrypt.hash(parsed.password, 12);
    return this.usersRepository.save({ ...parsed, passwordHash });
  }

  async updateStatus(id: string, active: boolean): Promise<User> {
    const user = await this.findById(id);
    return this.usersRepository.save({ ...user, active });
  }

  async updateUser(id: string, input: { fullName?: string; role?: Role; active?: boolean }): Promise<User> {
    const user = await this.findById(id);
    return this.usersRepository.save({ ...user, ...input });
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }
}

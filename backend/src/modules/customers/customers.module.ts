import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { CustomersRepository } from './customers.repository';
import { CustomersService } from './customers.service';
import { CustomersResolver } from './customers.resolver';
import { CustomersScheduler } from './customers.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  providers: [CustomersRepository, CustomersService, CustomersResolver, CustomersScheduler],
  exports: [CustomersService],
})
export class CustomersModule {}

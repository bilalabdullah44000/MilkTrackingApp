import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { CustomersRepository } from './customers.repository';
import { CustomersService } from './customers.service';
import { CustomersResolver } from './customers.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  providers: [CustomersRepository, CustomersService, CustomersResolver],
  exports: [CustomersService],
})
export class CustomersModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MilkDelivery } from './milk-delivery.entity';
import { MilkDeliveriesRepository } from './milk-deliveries.repository';
import { MilkDeliveriesService } from './milk-deliveries.service';
import { MilkDeliveriesResolver } from './milk-deliveries.resolver';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [TypeOrmModule.forFeature([MilkDelivery]), CustomersModule],
  providers: [MilkDeliveriesRepository, MilkDeliveriesService, MilkDeliveriesResolver],
  exports: [MilkDeliveriesService],
})
export class MilkDeliveriesModule {}

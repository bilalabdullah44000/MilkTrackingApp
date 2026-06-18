import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MilkPurchase } from '../milk-purchases/milk-purchase.entity';
import { MilkDelivery } from '../milk-deliveries/milk-delivery.entity';
import { DashboardService } from './dashboard.service';
import { DashboardResolver } from './dashboard.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([MilkPurchase, MilkDelivery])],
  providers: [DashboardService, DashboardResolver],
})
export class DashboardModule {}

import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingResolver } from './billing.resolver';
import { MilkPurchasesModule } from '../milk-purchases/milk-purchases.module';
import { MilkDeliveriesModule } from '../milk-deliveries/milk-deliveries.module';
import { VendorsModule } from '../vendors/vendors.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [MilkPurchasesModule, MilkDeliveriesModule, VendorsModule, CustomersModule],
  providers: [BillingService, BillingResolver],
})
export class BillingModule {}

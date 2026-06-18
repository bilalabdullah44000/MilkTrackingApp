import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MilkPurchase } from './milk-purchase.entity';
import { MilkPurchasesRepository } from './milk-purchases.repository';
import { MilkPurchasesService } from './milk-purchases.service';
import { MilkPurchasesResolver } from './milk-purchases.resolver';
import { VendorsModule } from '../vendors/vendors.module';

@Module({
  imports: [TypeOrmModule.forFeature([MilkPurchase]), VendorsModule],
  providers: [MilkPurchasesRepository, MilkPurchasesService, MilkPurchasesResolver],
  exports: [MilkPurchasesService],
})
export class MilkPurchasesModule {}

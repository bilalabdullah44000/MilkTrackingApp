import { Resolver, Query, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { MonthlyStatement } from './dto/billing.dto';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../users/user.entity';

@Resolver()
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(Role.OWNER)
export class BillingResolver {
  constructor(private readonly billingService: BillingService) {}

  @Query(() => MonthlyStatement)
  getMonthlyVendorBill(
    @Args('vendorId', { type: () => ID }) vendorId: string,
    @Args('month', { type: () => Int }) month: number,
    @Args('year', { type: () => Int }) year: number,
  ): Promise<MonthlyStatement> {
    return this.billingService.getMonthlyVendorBill(vendorId, month, year);
  }

  @Query(() => MonthlyStatement)
  getMonthlyCustomerInvoice(
    @Args('customerId', { type: () => ID }) customerId: string,
    @Args('month', { type: () => Int }) month: number,
    @Args('year', { type: () => Int }) year: number,
  ): Promise<MonthlyStatement> {
    return this.billingService.getMonthlyCustomerInvoice(customerId, month, year);
  }
}

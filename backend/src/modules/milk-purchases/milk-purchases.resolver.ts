import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MilkPurchasesService } from './milk-purchases.service';
import { MilkPurchase } from './milk-purchase.entity';
import { AddPurchaseInput } from './dto/milk-purchase.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../users/user.entity';
import { User } from '../users/user.entity';

@Resolver(() => MilkPurchase)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(Role.OWNER)
export class MilkPurchasesResolver {
  constructor(private readonly milkPurchasesService: MilkPurchasesService) {}

  @Query(() => [MilkPurchase])
  getPurchases(
    @Args('startDate', { type: () => String }) startDate: string,
    @Args('endDate', { type: () => String }) endDate: string,
    @Args('vendorIds', { type: () => [ID], nullable: true }) vendorIds?: string[],
  ): Promise<MilkPurchase[]> {
    return this.milkPurchasesService.findByDateRange(startDate, endDate, vendorIds);
  }

  @Mutation(() => MilkPurchase)
  addMilkPurchase(
    @Args('input') input: AddPurchaseInput,
    @CurrentUser() user: User,
  ): Promise<MilkPurchase> {
    return this.milkPurchasesService.create(input, user);
  }

  @Mutation(() => MilkPurchase)
  updateMilkPurchase(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: AddPurchaseInput,
    @CurrentUser() user: User,
  ): Promise<MilkPurchase> {
    return this.milkPurchasesService.update(id, input, user);
  }

  @Mutation(() => Boolean)
  deleteMilkPurchase(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.milkPurchasesService.delete(id);
  }
}

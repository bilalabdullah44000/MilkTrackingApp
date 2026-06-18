import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MilkDeliveriesService } from './milk-deliveries.service';
import { MilkDelivery } from './milk-delivery.entity';
import { AddDeliveryInput, BulkDeliveryItemInput, BulkDeliveryResponse } from './dto/milk-delivery.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../users/user.entity';
import { User } from '../users/user.entity';

@Resolver(() => MilkDelivery)
@UseGuards(GqlAuthGuard)
export class MilkDeliveriesResolver {
  constructor(private readonly milkDeliveriesService: MilkDeliveriesService) {}

  @Query(() => [MilkDelivery])
  getDeliveries(
    @Args('startDate', { type: () => String }) startDate: string,
    @Args('endDate', { type: () => String }) endDate: string,
    @Args('customerIds', { type: () => [ID], nullable: true }) customerIds?: string[],
  ): Promise<MilkDelivery[]> {
    return this.milkDeliveriesService.findByDateRange(startDate, endDate, customerIds);
  }

  @Mutation(() => MilkDelivery)
  addMilkDelivery(
    @Args('input') input: AddDeliveryInput,
    @CurrentUser() user: User,
  ): Promise<MilkDelivery> {
    return this.milkDeliveriesService.create(input, user);
  }

  @Mutation(() => MilkDelivery)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  updateMilkDelivery(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: AddDeliveryInput,
    @CurrentUser() user: User,
  ): Promise<MilkDelivery> {
    return this.milkDeliveriesService.update(id, input, user);
  }

  @Mutation(() => BulkDeliveryResponse)
  addBulkMilkDeliveries(
    @Args('input', { type: () => [BulkDeliveryItemInput] }) input: BulkDeliveryItemInput[],
    @CurrentUser() user: User,
  ): Promise<BulkDeliveryResponse> {
    return this.milkDeliveriesService.createBulk(input, user);
  }

  @Mutation(() => Boolean)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  deleteMilkDelivery(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.milkDeliveriesService.delete(id);
  }
}

import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { Customer } from './customer.entity';
import { CreateCustomerInput } from './dto/customer.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../users/user.entity';
import { User } from '../users/user.entity';

@Resolver(() => Customer)
@UseGuards(GqlAuthGuard)
export class CustomersResolver {
  constructor(private readonly customersService: CustomersService) {}

  @Query(() => [Customer])
  getCustomers(@Args('activeOnly', { nullable: true }) activeOnly?: boolean): Promise<Customer[]> {
    return this.customersService.findAll(activeOnly);
  }

  @Query(() => [Customer])
  getPendingCustomersForDelivery(
    @Args('date', { type: () => String }) date: string,
  ): Promise<Customer[]> {
    return this.customersService.findPendingForDate(date);
  }

  @Mutation(() => Customer)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  createCustomer(
    @Args('input') input: CreateCustomerInput,
    @CurrentUser() user: User,
  ): Promise<Customer> {
    return this.customersService.create(input, user);
  }

  @Mutation(() => Customer)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  updateCustomer(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: CreateCustomerInput,
    @CurrentUser() user: User,
  ): Promise<Customer> {
    return this.customersService.update(id, input, user);
  }

  @Mutation(() => Int)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  updateAllCustomersRate(
    @Args('defaultRate') defaultRate: number,
  ): Promise<number> {
    return this.customersService.updateAllDefaultRate(defaultRate);
  }
}

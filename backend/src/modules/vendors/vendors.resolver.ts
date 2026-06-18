import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { Vendor } from './vendor.entity';
import { CreateVendorInput } from './dto/vendor.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../users/user.entity';
import { User } from '../users/user.entity';

@Resolver(() => Vendor)
@UseGuards(GqlAuthGuard)
export class VendorsResolver {
  constructor(private readonly vendorsService: VendorsService) {}

  @Query(() => [Vendor])
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  getVendors(@Args('activeOnly', { nullable: true }) activeOnly?: boolean): Promise<Vendor[]> {
    return this.vendorsService.findAll(activeOnly);
  }

  @Mutation(() => Vendor)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  createVendor(
    @Args('input') input: CreateVendorInput,
    @CurrentUser() user: User,
  ): Promise<Vendor> {
    return this.vendorsService.create(input, user);
  }

  @Mutation(() => Vendor)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  updateVendor(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: CreateVendorInput,
    @CurrentUser() user: User,
  ): Promise<Vendor> {
    return this.vendorsService.update(id, input, user);
  }

}

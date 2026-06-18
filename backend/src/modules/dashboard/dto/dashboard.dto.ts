import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class DashboardStats {
  @Field()
  milkPurchasedLiters: number;

  @Field()
  milkSuppliedLiters: number;

  @Field()
  revenue: number;

  @Field()
  cost: number;

  @Field()
  profit: number;
}

import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class TransactionDetail {
  @Field(() => String)
  date: string;

  @Field()
  quantityLiters: number;

  @Field()
  ratePerLiter: number;

  @Field()
  amount: number;
}

@ObjectType()
export class MonthlyStatement {
  @Field(() => ID)
  entityId: string;

  @Field()
  entityName: string;

  @Field()
  month: string;

  @Field(() => Int)
  year: number;

  @Field(() => [TransactionDetail])
  transactions: TransactionDetail[];

  @Field()
  totalLiters: number;

  @Field(() => Int)
  totalDays: number;

  @Field()
  averageRate: number;

  @Field()
  totalAmount: number;
}

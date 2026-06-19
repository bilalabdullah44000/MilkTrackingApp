import { InputType, Field } from '@nestjs/graphql';
import { BillStatus } from '../customer.entity';

@InputType()
export class CreateCustomerInput {
  @Field()
  name: string;

  @Field()
  defaultRate: number;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => Boolean, { nullable: true })
  active?: boolean;

  @Field(() => BillStatus, { nullable: true })
  billStatus?: BillStatus;
}

import { InputType, Field, ID, ObjectType, Int } from '@nestjs/graphql';
import { MilkDelivery } from '../milk-delivery.entity';

@InputType()
export class AddDeliveryInput {
  @Field(() => ID)
  customerId: string;

  @Field(() => String)
  deliveryDate: string;

  @Field()
  quantityLiters: number;

  @Field()
  ratePerLiter: number;

  @Field({ nullable: true })
  notes?: string;
}

@InputType()
export class BulkDeliveryItemInput {
  @Field(() => ID)
  customerId: string;

  @Field(() => String)
  deliveryDate: string;

  @Field()
  quantityLiters: number;

  @Field()
  ratePerLiter: number;

  @Field({ nullable: true })
  notes?: string;
}

@ObjectType()
export class BulkDeliveryError {
  @Field(() => ID)
  customerId: string;

  @Field()
  customerName: string;

  @Field()
  reason: string;
}

@ObjectType()
export class BulkDeliveryResponse {
  @Field(() => Int)
  successCount: number;

  @Field(() => Int)
  failedCount: number;

  @Field(() => [MilkDelivery])
  createdDeliveries: MilkDelivery[];

  @Field(() => [BulkDeliveryError])
  errors: BulkDeliveryError[];
}

import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class AddPurchaseInput {
  @Field(() => ID)
  vendorId: string;

  @Field(() => String)
  purchaseDate: string;

  @Field()
  quantityLiters: number;

  @Field()
  ratePerLiter: number;

  @Field({ nullable: true })
  notes?: string;
}

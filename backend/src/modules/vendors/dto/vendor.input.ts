import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateVendorInput {
  @Field()
  name: string;

  @Field()
  defaultRate: number;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => Boolean, { nullable: true })
  active?: boolean;
}

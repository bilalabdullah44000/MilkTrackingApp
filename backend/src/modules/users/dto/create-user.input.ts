import { InputType, Field } from '@nestjs/graphql';
import { Role } from '../user.entity';

@InputType()
export class CreateUserInput {
  @Field()
  fullName: string;

  @Field()
  email: string;

  @Field()
  password: string;

  @Field(() => Role)
  role: Role;
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  fullName?: string;

  @Field(() => Role, { nullable: true })
  role?: Role;

  @Field(() => Boolean, { nullable: true })
  active?: boolean;
}

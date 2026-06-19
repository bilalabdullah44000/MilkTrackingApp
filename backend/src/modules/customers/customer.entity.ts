import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { User } from '../users/user.entity';

export enum BillStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
}

registerEnumType(BillStatus, { name: 'BillStatus' });

@ObjectType()
@Entity('customers')
export class Customer {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true, length: 255 })
  name: string;

  @Field()
  @Column('decimal', { precision: 10, scale: 2, name: 'default_rate' })
  defaultRate: number;

  @Field()
  @Column({ default: true })
  active: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @Field(() => BillStatus)
  @Column({ type: 'enum', enum: BillStatus, default: BillStatus.UNPAID, name: 'bill_status' })
  billStatus: BillStatus;

  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User;

  @Field(() => String)
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

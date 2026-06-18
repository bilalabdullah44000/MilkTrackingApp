import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../users/user.entity';
import { Vendor } from '../vendors/vendor.entity';

@ObjectType()
@Entity('milk_purchases')
@Unique(['vendor', 'purchaseDate'])
export class MilkPurchase {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Vendor)
  @ManyToOne(() => Vendor, { eager: false })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Field(() => String)
  @Column({ name: 'purchase_date', type: 'date' })
  purchaseDate: string;

  @Field()
  @Column('decimal', { precision: 10, scale: 1, name: 'quantity_liters' })
  quantityLiters: number;

  @Field()
  @Column('decimal', { precision: 10, scale: 2, name: 'rate_per_liter' })
  ratePerLiter: number;

  @Field()
  @Column('decimal', { precision: 12, scale: 2, name: 'total_amount' })
  totalAmount: number;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  notes?: string;

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

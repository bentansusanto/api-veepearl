import { Cart } from '../../../features/cart/entities/cart.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

@Entity('user')
export class User {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  otpCode?: string;

  @Column({ nullable: true, type: 'timestamp' })
  expOtp?: Date;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({ nullable: true })
  authToken: string;

  @Column({ nullable: true })
  accToken: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  expAccAt: Date;

  @OneToMany(() => Cart, (cart) => cart.user)
  carts: Cart[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Order } from '../../../features/order/entities/order.entity';
import { Cart } from '../../../features/cart/entities/cart.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pemesan } from '../../../features/pemesan/entities/pemesan.entity';

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

  @Column({unique: true})
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

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => Pemesan, (pemesan) => pemesan.user)
  pemesans: Pemesan[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

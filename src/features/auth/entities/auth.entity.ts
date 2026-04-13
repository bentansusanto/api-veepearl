import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cart } from '../../../features/cart/entities/cart.entity';
import { Order } from '../../../features/order/entities/order.entity';
import { Pemesan } from '../../../features/pemesan/entities/pemesan.entity';
import { UserSessions } from './user_session.entity';

import { Role } from './role.entity';

@Entity('user')
export class User {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @ManyToOne(() => Role, (role) => role.users, {
    eager: true,
  })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verifyToken: string;

  @Column({ nullable: true, type: 'timestamp' })
  expireVerifyToken: Date;

  @Column({ nullable: true })
  passwordResetToken: string;

  @Column({ nullable: true, type: 'timestamp' })
  passwordResetExpire: Date;

  @Column({ nullable: true, default: true })
  isActive: boolean;

  @OneToMany(() => UserSessions, (session) => session.user)
  sessions: UserSessions[];

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

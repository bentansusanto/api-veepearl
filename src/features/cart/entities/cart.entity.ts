import { Product } from '../../../features/product/entities/product.entity';
import { User } from '../../../features/auth/entities/auth.entity';
import {
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { Order } from '../../../features/order/entities/order.entity';

@Entity('cart')
export class Cart {
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => User, (user) => user.carts)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Order, (order) => order.carts, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => Product, (product) => product.carts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'float', nullable: true })
  total_price: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

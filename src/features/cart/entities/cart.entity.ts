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

@Entity('cart')
export class Cart {
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => User, (user) => user.carts)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Product, (product) => product.carts)
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

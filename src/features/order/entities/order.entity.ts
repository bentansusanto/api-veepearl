import { Pemesan } from "../../../features/pemesan/entities/pemesan.entity";
import { User } from "../../../features/auth/entities/auth.entity";
import { Entity, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Column, ManyToOne, OneToMany, JoinColumn, PrimaryGeneratedColumn } from "typeorm";
import { Cart } from "../../../features/cart/entities/cart.entity";

export enum OrderStatus {
    PENDING = 'pending',
    CANCELLED = 'cancelled',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
}

export enum PaymentMethod {
    COD = 'cod',
    PAYPAL = 'paypal',
}

export enum ShippingMethod {
    STANDARD = 'standard',
    EXPRESS = 'express',
}

export enum OrderType {
    ONLINE = 'online',
    OFFLINE = 'offline',
}

export enum PaymentStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    EXPIRED = 'expired',
}

@Entity('order')
export class Order {
    @PrimaryColumn()
    id: string;

    @ManyToOne(() => User, user => user.orders)
    @JoinColumn({name: "userId"})
    user: User;

    @ManyToOne(() => Pemesan, pemesan => pemesan.orders)
    @JoinColumn({name: "pemesanId"})
    pemesan: Pemesan;

    @OneToMany(() => Cart, cart => cart.order, {onDelete: 'CASCADE'})
    carts: Cart[];

    @Column()
    amount: number;

    @Column()
    order_code: string

    @Column({nullable: true})
    payerEmail: string;

    @Column({nullable: true})
    transactionId: string;

    @Column({
        type: 'enum',
        enum: OrderType,
        default: OrderType.ONLINE,
      })
      order_type: OrderType;

    @Column({
        type: 'enum',
        enum: PaymentMethod,
      })
      payment_method: PaymentMethod;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
      })
      payment_status: PaymentStatus;

    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.PENDING,
      })
      order_status: OrderStatus;

    @Column({
        type: 'enum',
        enum: ShippingMethod,
        default: ShippingMethod.STANDARD,
        nullable: true,
      })
      shipping_method: ShippingMethod;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

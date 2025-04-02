import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Jeweltype } from "../jeweltype/entities/jeweltype.entity";

@Entity('product')
export class Product {
    @PrimaryColumn()
    id: string;

    @ManyToOne(() => Jeweltype, (jeweltype) => jeweltype.products)
    @JoinColumn({ name: 'jeweltypeId' })
    jeweltype: Jeweltype;

    @Column()
    name_product: string

    @Column()
    slug: string;

    @Column({type: 'float'})
    price: number;

    @Column()
    description: string;

    @Column()
    grade: string;

    @Column({unique: true})
    sku: string;

    @Column({nullable: true})
    size: string;

    @Column()
    thumbnail: string;

    @Column({default: true})
    stock_ready: boolean;

    @Column({default: false})
    popular: boolean;

    @Column({type: 'json'})
    images: string[];

    @Column({type: 'json'})
    video: string[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

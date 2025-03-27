import { CreateDateColumn, UpdateDateColumn , Entity, PrimaryColumn, OneToMany, Column } from "typeorm";
import { Product } from "../../entities/product.entity";

@Entity('jeweltype')
export class Jeweltype {
    @PrimaryColumn()
    id: string;

    @OneToMany(() => Product, (product) => product.jeweltype)
    products: Product[]; // Assuming you have a Product entity with a foreign key to Jeweltyp

    @Column()
    name_type: string;

    @Column()
    type: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

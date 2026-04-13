import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './auth.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ unique: true })
  name: string; // e.g., 'ADMIN', 'CUSTOMER'

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}

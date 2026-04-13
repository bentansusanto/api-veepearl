import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './auth.entity';

@Entity('user_sessions')
export class UserSessions {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, (user) => user.sessions, {
    eager: false,
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'access_token', nullable: true })
  access_token: string;

  @Column({ name: 'refresh_token' })
  ref_token: string;

  @Column()
  expire_at: string;

  @Column()
  client_ip: string;

  @Column({
    default: false,
  })
  is_blocked: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

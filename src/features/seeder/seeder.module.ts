import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { User } from '../auth/entities/auth.entity';
import { Role } from '../auth/entities/role.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), AuthModule],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}

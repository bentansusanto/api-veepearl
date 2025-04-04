import { Module } from '@nestjs/common';
import { PemesanService } from './pemesan.service';
import { PemesanController } from './pemesan.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/auth.entity';
import { Pemesan } from './entities/pemesan.entity';
import { ValidationService } from '../../common/validation.service';

@Module({
  controllers: [PemesanController],
  providers: [PemesanService, ValidationService],
  imports: [TypeOrmModule.forFeature([Pemesan, User])],
})
export class PemesanModule {}

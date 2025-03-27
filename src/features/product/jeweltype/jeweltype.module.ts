import { Module } from '@nestjs/common';
import { JeweltypeService } from './jeweltype.service';
import { JeweltypeController } from './jeweltype.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Jeweltype } from './entities/jeweltype.entity';
import { User } from '../../../features/auth/entities/auth.entity';
import { ValidationService } from '../../../common/validation.service';

@Module({
  controllers: [JeweltypeController],
  providers: [JeweltypeService, ValidationService],
  imports: [TypeOrmModule.forFeature([Jeweltype, User])],
})
export class JeweltypeModule {}

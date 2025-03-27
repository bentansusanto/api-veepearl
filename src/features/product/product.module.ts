import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { JeweltypeModule } from './jeweltype/jeweltype.module';
import { User } from '../auth/entities/auth.entity';
import { Jeweltype } from './jeweltype/entities/jeweltype.entity';
import { Product } from './entities/product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValidationService } from 'src/common/validation.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService, ValidationService],
  imports: [JeweltypeModule, TypeOrmModule.forFeature([Product, Jeweltype, User])],
})
export class ProductModule {}

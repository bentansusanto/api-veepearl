import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { Product } from '../product/entities/product.entity';
import { User } from '../auth/entities/auth.entity';
import { ValidationService } from 'src/common/validation.service';

@Module({
  controllers: [CartController],
  providers: [CartService, ValidationService],
  imports: [TypeOrmModule.forFeature([Cart, Product, User])],
})
export class CartModule {}

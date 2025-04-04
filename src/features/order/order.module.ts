import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { ValidationService } from '../../common/validation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Pemesan } from '../pemesan/entities/pemesan.entity';
import { User } from '../auth/entities/auth.entity';
import { SendMailService } from '../../common/send-mail.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService, ValidationService, SendMailService],
  imports: [TypeOrmModule.forFeature([Order, Cart, Pemesan, User])],
})
export class OrderModule {} 

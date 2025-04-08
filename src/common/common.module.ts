import {
  Global,
  MiddlewareConsumer,
  Module,
  RequestMethod,
} from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import winston from 'winston';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ValidationService } from './validation.service';
import { APP_FILTER } from '@nestjs/core';
import { ErrorFilter } from './error.config';
import { SendMailService } from './send-mail.service';
import { User } from '../features/auth/entities/auth.entity';
import { AuthMiddleware } from './middleware';
import { Product } from '../features/product/entities/product.entity';
import { Jeweltype } from '../features/product/jeweltype/entities/jeweltype.entity';
import { Cart } from '../features/cart/entities/cart.entity';
import { Pemesan } from '../features/pemesan/entities/pemesan.entity';
import { Order } from '../features/order/entities/order.entity';
@Global()
@Module({
  imports: [
    WinstonModule.forRoot({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [new winston.transports.Console()],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'development' ? '.env.development' : '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<string>('DB_PORT')),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS') || 'Veepearls01!',
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        charset: 'utf8mb4',
      }),
    }),
    TypeOrmModule.forFeature([User, Product, Jeweltype, Cart, Pemesan, Order]),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
  ],
  providers: [
    ValidationService,
    SendMailService,
    { provide: APP_FILTER, useClass: ErrorFilter },
  ],
  exports: [TypeOrmModule, ThrottlerModule],
})
export class CommonModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        // authentication
        {
          path: 'api/v1/auth/register',
          method: RequestMethod.POST,
        },
        {
          path: 'api/v1/auth/verify_account',
          method: RequestMethod.POST,
        },
        {
          path: 'api/v1/auth/login',
          method: RequestMethod.POST,
        },
        {
          path: 'api/v1/auth/verify_otp',
          method: RequestMethod.POST,
        },
        {
          path: 'api/v1/auth/generate_new_otp',
          method: RequestMethod.POST,
        },
        {
          path: 'api/v1/auth/refresh_token',
          method: RequestMethod.POST,
        },
        {
          path: 'api/v1/auth/forgot_password',
          method: RequestMethod.POST,
        },
        {
          path: 'api/v1/auth/reset_password',
          method: RequestMethod.POST,
        },
        // product
        {
          path: 'api/v1/products',
          method: RequestMethod.GET,
        },
        {
          path: 'api/v1/products/:id',
          method: RequestMethod.GET,
        },
        // jeweltype
        {
          path: 'api/v1/jeweltypes',
          method: RequestMethod.GET,
        },
        {
          path: 'api/v1/jeweltypes/:id',
          method: RequestMethod.GET,
        },
      )
      .forRoutes(
        // authentication
        {
          path: 'api/v1/auth/getUser',
          method: RequestMethod.GET,
        },
        {
          path: 'api/v1/auth/logout',
          method: RequestMethod.POST,
        },
        // product
        {
          path: 'api/v1/create_product',
          method: RequestMethod.POST,
        },
        {
          path: 'api/v1/update_product/:id',
          method: RequestMethod.PUT,
        },
        {
          path: 'api/v1/delete_product/:id',
          method: RequestMethod.DELETE,
        },
        // jeweltype
        {
          path: 'api/v1/create_jeweltype',
          method: RequestMethod.POST,
        },
        {
          path: 'api/v1/update_jeweltype/:id',
          method: RequestMethod.PUT,
        },
        {
          path: 'api/v1/delete_jeweltype/:id',
          method: RequestMethod.DELETE,
        },
        // cart
        {
          path: 'api/v1/add_cart',
          method: RequestMethod.POST,
        },
        {
          path: 'api/v1/find_cart',
          method: RequestMethod.GET,
        },
        {
          path: 'api/v1/update_product_cart/:id',
          method: RequestMethod.PUT,
        },
        {
          path: 'api/v1/remove_product_cart/:id',
          method: RequestMethod.DELETE,
        },
        // pemesan
        {
          path: 'api/v1/create_pemesan',
          method: RequestMethod.POST,
        },
        {
          path: 'api/v1/update_pemesan/:id',
          method: RequestMethod.PUT,
        },
        {
          path: 'api/v1/delete_pemesan/:id',
          method: RequestMethod.DELETE,
        },
        {
          path: 'api/v1/find_pemesan/:id',
          method: RequestMethod.GET,
        },
        {
          path: 'api/v1/find_all_pemesan',
          method: RequestMethod.GET,
        },
        // order
        {
          path: 'api/v1/create_order_product',
          method: RequestMethod.POST,
        },
        {
          path: 'api/v1/capture_payment_paypal',
          method: RequestMethod.POST,
        },
        {
          path: 'api/v1/verify_payment_paypal',
          method: RequestMethod.GET,
        },
        {
          path: 'api/v1/verify_payment_cod/:id',
          method: RequestMethod.POST,
        },
        {
          path: 'api/v1/find_history_order',
          method: RequestMethod.GET,
        },
        {
          path: 'api/v1/find_order_user',
          method: RequestMethod.GET,
        },
      );
  }
}

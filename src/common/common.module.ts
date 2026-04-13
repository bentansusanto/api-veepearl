import {
  Global,
  MiddlewareConsumer,
  Module,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import winston from 'winston';
import { User } from '../features/auth/entities/auth.entity';
import { Cart } from '../features/cart/entities/cart.entity';
import { Order } from '../features/order/entities/order.entity';
import { Pemesan } from '../features/pemesan/entities/pemesan.entity';
import { Product } from '../features/product/entities/product.entity';
import { Jeweltype } from '../features/product/jeweltype/entities/jeweltype.entity';
import { Role } from '../features/auth/entities/role.entity';
import { UserSessions } from '../features/auth/entities/user_session.entity';
import { ErrorFilter } from './error.config';
import { SendMailService } from './send-mail.service';
import { ValidationService } from './validation.service';

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
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('NODE_ENV') === 'production',
        charset: 'utf8mb4',
        ssl: false,
        extra: {
          connectionLimit: 10,
          ssl: false,
        },
        connectTimeout: 60000,
        // logging: true,
      }),
    }),
    TypeOrmModule.forFeature([
      User,
      Role,
      UserSessions,
      Product,
      Jeweltype,
      Cart,
      Pemesan,
      Order,
    ]),
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
  exports: [TypeOrmModule, ThrottlerModule, ValidationService, SendMailService],
})
export class CommonModule {}

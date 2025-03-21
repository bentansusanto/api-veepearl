import { Global, MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
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
    TypeOrmModule.forFeature([User]),
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
    configure(consumer: MiddlewareConsumer){
        consumer.apply(AuthMiddleware)
        .exclude(
            {
                path: 'api/v1/auth/register',
                method: RequestMethod.POST
            }
        )
        .forRoutes()
    }
}

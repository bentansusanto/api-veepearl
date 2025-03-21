import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/auth.entity';
import { ValidationService } from '../../common/validation.service';
import { SendMailService } from '../../common/send-mail.service';
import { UserService } from './user/user.service';
import { OtpService } from './otp/otp.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, ValidationService, SendMailService, UserService, OtpService],
  imports: [UserModule, TypeOrmModule.forFeature([User])],
})
export class AuthModule {}

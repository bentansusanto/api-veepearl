import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import crypto from 'crypto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { CheckEmail, VerifyOtp } from '../../../models/auth.model';
import { Logger } from 'winston';
import { User } from '../entities/auth.entity';
import { Repository } from 'typeorm';
import { SendMailService } from '../../../common/send-mail.service';
import { EmailType } from '../../../common/subject-email.config';

@Injectable()
export class OtpService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly sendMailService: SendMailService,
  ) {}
  private otpExpiryDuration = 15 * 60 * 1000;

  generateOTP(): { otpCode: string; expiry: number } {
    const otpCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    const expiry = Date.now() + this.otpExpiryDuration;
    return { otpCode, expiry };
  }

  async verifyOtp(reqOtp: VerifyOtp): Promise<any> {
    try {
      const startTime = Date.now();
      this.logger.info(`Start verifying OTP at ${startTime}`);
  
      const findUser = await this.userRepository.findOne({
        where: { otpCode: reqOtp.otpCode },
      });
  
      this.logger.info(`User found at ${Date.now()}, took ${Date.now() - startTime}ms`);
  
      if (
        !findUser ||
        findUser.otpCode !== reqOtp.otpCode ||
        !findUser.expOtp ||
        new Date().getTime() > findUser.expOtp.getTime()
      ) {
        this.logger.error('Invalid or expired OTP code');
        throw new HttpException(
          'Invalid or expired OTP code',
          HttpStatus.BAD_REQUEST,
        );
      }
  
      // Generate tokens dengan jumlah byte lebih kecil
      const accessToken = crypto.randomBytes(100).toString('hex').toUpperCase();
      const refreshToken = crypto.randomBytes(100).toString('hex').toUpperCase();
      
      const accessTokenExpiresAt = new Date();
      accessTokenExpiresAt.setHours(accessTokenExpiresAt.getHours() + 1);
      // Gunakan save() agar lebih cepat
      await this.userRepository.update(findUser.id, {
        otpCode: null,
        expOtp: null,
        accToken: accessToken,
        authToken: refreshToken,
        expAccAt: accessTokenExpiresAt.toISOString(),
      })
  
      this.logger.info(`User updated successfully at ${Date.now()}, took ${Date.now() - startTime}ms`);
  
      return {
        message: 'OTP verified successfully',
        token: accessToken,
        refreshToken: refreshToken,
      };
    } catch (error: any) {
      this.logger.error(error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  

  async generateNewOtp(reqGenerate: CheckEmail): Promise<any> {
    try {
      const findUser = await this.userRepository.findOne({
        where: { email: reqGenerate.email },
      });
  
      if (!findUser) {
        this.logger.error('User not found');
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
  
      const { otpCode, expiry } = this.generateOTP();
  
      // Gunakan save() agar lebih aman
      findUser.otpCode = otpCode;
      findUser.expOtp = new Date(expiry);
      await this.userRepository.save(findUser);
  
      // Coba tangani error pengiriman email dengan baik
      try {
        await this.sendMailService.sendMail(EmailType.GENERATE_NEW_OTP, {
          email: reqGenerate.email,
          otpCode,
          subjectMessage: 'Generate New OTP',
        });
      } catch (mailError) {
        this.logger.error('Failed to send email:', mailError);
        throw new HttpException('Failed to send email', HttpStatus.INTERNAL_SERVER_ERROR);
      }
  
      this.logger.info('OTP generated successfully, check your email');
  
      return {
        message: 'OTP generated successfully, check your email',
      };
    } catch (error: any) {
      this.logger.error('Error details:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
}

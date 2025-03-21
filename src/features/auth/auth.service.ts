import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ValidationService } from '../../common/validation.service';
import { Logger } from 'winston';
import { User, UserRole } from './entities/auth.entity';
import { Repository } from 'typeorm';
import { CheckEmail, LoginRequest, RegisterRequest, ResetPasswordRequest, VerifyAccount } from '../../models/auth.model';
import Hashids from 'hashids';
import { AuthValidation } from './validation/auth.validation';
import bcrypt from 'bcryptjs'
import { SendMailService } from '../../common/send-mail.service';
import { EmailType } from '../../common/subject-email.config';
import { OtpService } from './otp/otp.service';
import { Request, Response } from 'express';
import crypto from 'crypto'

@Injectable()
export class AuthService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly validationService: ValidationService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly sendMailService:SendMailService,
    private readonly otpService: OtpService
  ) {}

  private hashIds = new Hashids(process.env.ID_SECRET, 20)
  // create new account
  async createNewAccount(registerReq:RegisterRequest): Promise<any> {
    try {
      let createReq: RegisterRequest;
      // validation field register
      try {
        createReq = this.validationService.validate(
          AuthValidation.CREATEAUTH,
          registerReq,
        )
      } catch (error:any) {
        this.logger.error(error.message)
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST)
      }

      // find existing user
      const existingUser = await this.userRepository.findOne({
        where: { email: createReq.email },
      })
      if (existingUser) {
        this.logger.error('Email already exists')
        throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST)
      }

      const hashPassword = await bcrypt.hash(createReq.password, 10)

      const { otpCode, expiry } = this.otpService.generateOTP();
      // create new user
      const newUser = this.userRepository.create({
        id: this.hashIds.encode(Date.now()),
        email: createReq.email,
        password: hashPassword,
        name: createReq.name,
        role: createReq.role || UserRole.CLIENT,
        otpCode,
        expOtp: new Date(expiry),
      })
      await this.userRepository.save(newUser)
      // send mail for verify account
      await this.sendMailService.sendMail(EmailType.VERIFY_ACCOUNT,{
        email: newUser.email,
        otpCode,
        subjectMessage: 'Verify Account'
      })

      this.logger.info({
        message: 'New account created',
        data: {
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        }
      })

      return{
        message: 'New account created',
        data: {
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        }
      }
    } catch (error:any) {
      this.logger.error('Failed to create account', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create account',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  // verify account
  async verifyAccount(verifyReq: VerifyAccount):Promise<any> {
    try {
      // find user by email
      const findUser = await this.userRepository.findOne({
        where: {
          email: verifyReq.email,
        }
      })
      // check if user not found
      if (!findUser) {
        this.logger.error("User not found")
        throw new HttpException("User not found", HttpStatus.NOT_FOUND)
      }

      // check if user already verified
      if(findUser.isVerified){
        this.logger.error("Account already verified")
        throw new HttpException("Account already verified", HttpStatus.BAD_REQUEST)
      }

      // update user verified status
      await this.userRepository.update(findUser.id, {
        isVerified: true,
        otpCode: null,
        expOtp: null,
      })

      this.logger.info({
        message: 'Account verified continue to login',
        data: {
          name: findUser.name,
          email: findUser.email,
          role: findUser.role || UserRole.CLIENT,
        },
      });

      return {
        message: 'Account verified, continue to login',
        data: {
          name: findUser.name,
          email: findUser.email,
          role: findUser.role || UserRole.CLIENT,
        },
      };

    } catch (error:any) {
      this.logger.error('Failed to verify account', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to verify account',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // login user
  async loginUser(loginReq: LoginRequest):Promise<any> {
    try {
      // find user
      const findUser = await this.userRepository.findOne({
        where: {
          email: loginReq.email,
          isVerified: true,
        }
      })
      // check if user not exist or not verified
      if (!findUser) {
        this.logger.error("User not found or not verified");
        throw new HttpException(" User not found or not verified", HttpStatus.NOT_FOUND);
      }

      const isValidPassword = await bcrypt.compare(
        loginReq.password,
        findUser.password,
      );
      if (!isValidPassword) {
        this.logger.error('Invalid password');
        throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);
      }

      const { otpCode, expiry } = this.otpService.generateOTP();
      await this.userRepository.update(findUser.id, {
        otpCode,
        expOtp: new Date(expiry),
      });
      // send mail for verify otp
      await this.sendMailService.sendMail(EmailType.VERIFY_OTP, {
        email: findUser.email,
        otpCode,
        subjectMessage: 'Verify Otp',
      });

      this.logger.info({
        message: 'User login successfully',
      });

      return {
        message: 'Login Successfull Check OTP Code in your email',
      };
    } catch (error:any) {
      this.logger.error('Failed to create subscription', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create subscription',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // get user
  async getUser(user:User):Promise<any> {
    try {
      return{
        message: 'User found',
        data: {
          name: user.name,
          email: user.email,
          role: user.role,
        }
      }
    } catch (error:any) {
      this.logger.error('Failed to get user', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // logout user
  async logout(userId: string):Promise<any> {
    try {
      // find user by id
      const findUser = await this.userRepository.findOne({ where: { id: userId } });
      // check if user not found
      if (!findUser) {
        this.logger.error("User not found");
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      // update logout
      await this.userRepository.update(findUser.id,{
        authToken: null,
        accToken: null
      })
      this.logger.info({
        message: 'User logout successfully',
      })
      return {
        message: "User logout successfully"
      }
    } catch (error:any) {
      this.logger.error('Failed to logout', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to logout',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // refresh token
  async refreshTokens(req:Request, res:Response):Promise<any> {
    try {
      const refreshToken = req.cookies.session_token;
      if (!refreshToken) {
        this.logger.error("Refresh token not found");
        throw new HttpException('Refresh token not found', HttpStatus.NOT_FOUND);
      }
      const findUser = await this.userRepository.findOne({ where: { authToken: refreshToken } });
       if (!findUser || findUser.authToken !== refreshToken) {
        this.logger.error('Invalid refresh token');
        throw new HttpException(
          'Invalid refresh token',
          HttpStatus.UNAUTHORIZED,
        );
      }
      const newAccessToken = crypto.randomBytes(100).toString('hex').toUpperCase();
      const newRefreshToken = crypto.randomBytes(100).toString('hex').toUpperCase();

      const accessTokenExpiresAt = new Date();
      accessTokenExpiresAt.setHours(accessTokenExpiresAt.getHours() + 1);

      await this.userRepository.update(findUser.id,{
        accToken: newAccessToken,
        authToken: newRefreshToken,
        expAccAt: accessTokenExpiresAt.toISOString()
      })
      this.logger.info({
        message: 'Refresh token successfully',
      })

      res.setHeader('Authorization', `Bearer ${newAccessToken}`);
      res.cookie('session_token', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1
      })

      res.status(200).json({
        error: false,
        message: 'Token refresh successful',
        tokens: newAccessToken,
      });

    } catch (error:any) {
      this.logger.error(error.message);
      if (error instanceof HttpException) {
        throw error; // Jika sudah HttpException, lempar ulang
      }
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // forgot password
  async forgotPassword(checkEmail: CheckEmail): Promise<any> {
    try {
      // find user by email
      const findUser = await this.userRepository.findOne({ where: { email: checkEmail.email }})
      // check if user not found
      if (!findUser) {
        this.logger.error("User not found");
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const { otpCode, expiry } = this.otpService.generateOTP();
       await this.userRepository.update(findUser.id, {
        otpCode,
        expOtp: new Date(expiry),
      })

      await this.sendMailService.sendMail(EmailType.RESET_PASSWORD,{
        email: findUser.email,
        otpCode,
        subjectMessage: 'Reset Password',
      })
      this.logger.info({
        message: 'Forgot password successfully',
      })
      return {
        error: false,
        message: 'Forgot password successfully check your email',
      }
    } catch (error:any) {
      this.logger.error('Failed to logout', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to logout',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // reset password
  async resetPassword(requestReset: ResetPasswordRequest):Promise<any> {
    try {
      const findUser = await this.userRepository.findOne({ where: { email: requestReset.email } });
      if (!findUser) {
        this.logger.error('User not found');
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      let resetReq: ResetPasswordRequest;
      try {
        resetReq = this.validationService.validate(
          AuthValidation.RESETPASSWORD,
          requestReset,
        )
      } catch (error:any) {
        this.logger.error(error.message)
        throw new HttpException('Invalid Validation', HttpStatus.BAD_REQUEST)
      }

      if (resetReq.password !== resetReq.retryPassword) {
        this.logger.error('Password and retry password not match');
        throw new HttpException(
          'Password and retry password not match',
          HttpStatus.BAD_REQUEST,
        );
      }

      const hashedPassword = await bcrypt.hash(requestReset.password, 10);
     await this.userRepository.update(requestReset.email,{
        password: hashedPassword,
        otpCode: null,
        expOtp: null,
      })
      this.logger.info({
        message: 'Password reset successfully',
      })

      return{
        message: 'Password reset successfully',
        data: {
          name: findUser.name,
          email: findUser.email,
          role: findUser.role,
        }
      }
      
    } catch (error:any) {
      this.logger.error(error.message);
      if (error instanceof HttpException) {
        throw error; // Jika sudah HttpException, lempar ulang
      }
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

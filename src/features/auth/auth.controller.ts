import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  CheckEmail,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyAccount,
  VerifyOtp,
} from '../../models/auth.model';
import { AuthService } from './auth.service';
import { OtpService } from './otp/otp.service';

@Controller('api/v1/auth/')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
  ) {}

  // create new user registration
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerReq: RegisterRequest): Promise<any> {
    const result = await this.authService.createNewAccount(registerReq);
    return {
      message: result.message,
      data: result.data,
    };
  }

  // verify account
  @Post('verify_account')
  @HttpCode(HttpStatus.OK)
  async verifyAccount(@Body() verifyReq: VerifyAccount): Promise<any> {
    const result = await this.authService.verifyAccount(verifyReq);
    return {
      message: result.message,
      data: result.data,
    };
  }

  // login user
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginUser(@Body() loginReq: LoginRequest): Promise<any> {
    const result = await this.authService.loginUser(loginReq);
    return {
      message: result.message,
      data: result.data,
    };
  }

  // verify otp
  @Post('verify_otp')
  @HttpCode(HttpStatus.OK)
  async otpCode(@Res() res: Response, @Body() reqOtp: VerifyOtp): Promise<any> {
    const result = await this.otpService.verifyOtp(reqOtp);
    res.setHeader('Authorization', `Bearer ${result.token}`);
    res.cookie('session_token', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).send({
      error: false,
      message: result.message,
      data: result.token,
    });
  }

  // generate new otp
  @Post('generate_otp')
  @HttpCode(HttpStatus.OK)
  async generateOtp(@Body() reqGenerate: CheckEmail): Promise<any> {
    const result = await this.otpService.generateNewOtp(reqGenerate);
    return {
      error: false,
      message: result.message,
      data: result.data,
    };
  }

  // get user
  @Get('getUser')
  @HttpCode(HttpStatus.OK)
  async getUser(@Req() req: Request): Promise<any> {
    const user = req['user'];
    if (!user) {
      throw new HttpException(
        {
          error: true,
          message: 'User Unauthorized',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    const result = await this.authService.getUser(user);
    return {
      error: false,
      message: result.message,
      data: result.data,
    };
  }

  // logout
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res() res: Response): Promise<any> {
    const user = req['user'];
    if (!user) {
      throw new HttpException(' User Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const userId = user.id;
    await this.authService.logout(userId);
    return res.clearCookie('session_token').send({
      error: false,
      message: 'Success logout user',
    });
  }

  // refresh token
  @Post('/refresh_token')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Req() req: Request, @Res() res: Response): Promise<any> {
    await this.authService.refreshTokens(req, res);
    res.status(200).send({
      error: false,
      message: 'Success refresh token',
    });
  }

  // forgot password
  @Post('forgot_password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() email: CheckEmail): Promise<any> {
    const result = await this.authService.forgotPassword(email);
    return {
      error: false,
      message: result.message,
    };
  }

  // reset password
  @Post('reset_password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetReq: ResetPasswordRequest): Promise<any> {
    const result = await this.authService.resetPassword(resetReq);
    return {
      error: false,
      message: result.message,
      data: result.data,
    };
  }
}

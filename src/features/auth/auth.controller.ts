import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginRequest,
  RegisterRequest,
  VerifyAccountRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../../models/auth.model';
import { Request, Response } from 'express';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { User } from './entities/auth.entity';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerReq: RegisterRequest) {
    return this.authService.register(registerReq);
  }

  @Post('resend_verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }

  @Post('verify_account')
  @HttpCode(HttpStatus.OK)
  async verifyAccount(@Body() verifyReq: VerifyAccountRequest) {
    return this.authService.verifyAccount(verifyReq);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginReq: LoginRequest,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
  ) {
    const result = await this.authService.login(loginReq, ip);

    // Set Session Token in HttpOnly Cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('session_token', result.data.sessiontoken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Remove session_token from response body for security
    delete result.data.sessiontoken;

    return result;
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Res({ passthrough: true }) res: Response,
    @Body('session_token') sessionToken: string,
  ) {
    // Also clear the cookie
    res.clearCookie('session_token');
    return this.authService.logout(sessionToken);
  }

  @Post('refresh_token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body('session_token') bodySessionToken: string,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const sessionToken = bodySessionToken || req.cookies['session_token'];
    const result = await this.authService.refreshToken(sessionToken);

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('session_token', result.data.sessiontoken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    delete result.data.sessiontoken;
    return result;
  }

  @Post('forgot_password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotReq: ForgotPasswordRequest) {
    return this.authService.forgotPassword(forgotReq);
  }

  @Post('reset_password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetReq: ResetPasswordRequest) {
    return this.authService.resetPassword(resetReq);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: User) {
    return this.authService.getCurrentUser(user);
  }

  @Get('admin_only')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async adminOnly() {
    return { message: 'You have admin access' };
  }
}

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Hashids from 'hashids';
import { Repository } from 'typeorm';
import { SecurityService } from '../../common/security.service';
import { SendMailService } from '../../common/send-mail.service';
import { EmailType } from '../../common/subject-email.config';
import { ValidationService } from '../../common/validation.service';
import {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyAccountRequest,
} from '../../models/auth.model';
import { User } from './entities/auth.entity';
import { Role } from './entities/role.entity';
import { UserSessions } from './entities/user_session.entity';
import { AuthValidation } from './validation/auth.validation';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserSessions)
    private readonly sessionRepository: Repository<UserSessions>,
    private readonly validationService: ValidationService,
    private readonly securityService: SecurityService,
    private readonly sendMailService: SendMailService,
  ) {}

  private hashIds = new Hashids(process.env.ID_SECRET, 20);

  /**
   * Register a new user
   */
  async register(registerReq: RegisterRequest): Promise<AuthResponse> {
    const validatedReq = this.validationService.validate(
      AuthValidation.CREATEAUTH,
      registerReq,
    );

    const existingUser = await this.userRepository.findOne({
      where: { email: validatedReq.email },
    });
    if (existingUser) {
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await this.securityService.hashPassword(
      validatedReq.password,
    );

    // Determine role (default to 'customer')
    const roleName = validatedReq.roleName || 'customer';

    // constraint: only customer and owner can register
    if (roleName !== 'customer' && roleName !== 'owner') {
      throw new HttpException(
        'Registration for this role is not allowed',
        HttpStatus.FORBIDDEN,
      );
    }

    const role = await this.roleRepository.findOne({
      where: { name: roleName },
    });
    if (!role) {
      throw new HttpException(
        `Role '${roleName}' not found. Please contact administrator.`,
        HttpStatus.NOT_FOUND,
      );
    }

    // constraint: owner limited to 2 users
    if (roleName === 'owner') {
      const ownerCount = await this.userRepository.count({
        where: { role: { name: 'owner' } },
      });
      if (ownerCount >= 2) {
        throw new HttpException(
          'Owner limit reached (maximum 2 owners allowed)',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const verifyToken = this.securityService.generateRandomToken(32);
    const expireAt = new Date();
    expireAt.setHours(expireAt.getHours() + 24); // 24 hours

    const newUser = this.userRepository.create({
      id: this.hashIds.encode(Date.now()),
      email: validatedReq.email,
      password: hashedPassword,
      name: validatedReq.name,
      role: role,
      verifyToken: verifyToken,
      expireVerifyToken: expireAt,
      isVerified: false,
    });

    await this.userRepository.save(newUser);

    // Send verification email with link
    const isAdmin = newUser.role.name === 'owner';
    const frontendUrl = isAdmin
      ? process.env.ADMIN_URL_DEV || 'http://localhost:3700'
      : process.env.FRONTEND_URL_DEV || 'http://localhost:3300';
    const verifyUrl = `${frontendUrl}/verify-account?verify_token=${verifyToken}`;

    await this.sendMailService.sendMail(EmailType.VERIFY_ACCOUNT, {
      email: newUser.email,
      otpCode: verifyUrl, // Passing the full URL as the code
      subjectMessage: 'Verify Your Account',
    });

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role.name,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    };
  }

  /**
   * Resend Verification Link
   */
  async resendVerification(email: string): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (user.isVerified) {
      throw new HttpException(
        'Account already verified',
        HttpStatus.BAD_REQUEST,
      );
    }

    const verifyToken = this.securityService.generateRandomToken(32);
    const expireAt = new Date();
    expireAt.setHours(expireAt.getHours() + 24);

    user.verifyToken = verifyToken;
    user.expireVerifyToken = expireAt;
    await this.userRepository.save(user);

    const isAdmin = user.role.name === 'owner';
    const frontendUrl = isAdmin
      ? process.env.ADMIN_URL_DEV || 'http://localhost:3700'
      : process.env.FRONTEND_URL_DEV || 'http://localhost:3300';
    const verifyUrl = `${frontendUrl}/verify-account?verify_token=${verifyToken}`;

    await this.sendMailService.sendMail(EmailType.VERIFY_ACCOUNT, {
      email: user.email,
      otpCode: verifyUrl,
      subjectMessage: 'Verify Your Account (New Link Requested)',
    });

    return {
      message: 'A new verification link has been sent to your email.',
    };
  }

  /**
   * Verify account using token
   */
  async verifyAccount(verifyReq: VerifyAccountRequest): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({
      where: { verifyToken: verifyReq.token },
    });

    if (!user) {
      throw new HttpException(
        'Invalid verification token or email',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (user.isVerified) {
      throw new HttpException(
        'Account already verified',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      user.expireVerifyToken &&
      new Date() > new Date(user.expireVerifyToken)
    ) {
      throw new HttpException(
        'Verification link has expired. Please request a new one.',
        HttpStatus.GONE,
      );
    }

    user.isVerified = true;
    user.verifyToken = null;
    user.expireVerifyToken = null;
    await this.userRepository.save(user);

    return {
      message: 'Account verified successfully. You can now log in.',
    };
  }

  /**
   * Login user and generate tokens
   */
  async login(loginReq: LoginRequest, ip: string): Promise<AuthResponse> {
    const validatedReq = this.validationService.validate(
      AuthValidation.LOGIN,
      loginReq,
    );

    const user = await this.userRepository.findOne({
      where: { email: validatedReq.email },
      relations: ['role'],
    });

    if (
      !user ||
      !(await this.securityService.verifyPassword(
        validatedReq.password,
        user.password,
      ))
    ) {
      throw new HttpException(
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!user.isVerified) {
      throw new HttpException(
        'Please verify your account first',
        HttpStatus.FORBIDDEN,
      );
    }

    const accessToken = this.securityService.generateAccessToken();
    const sessionToken = this.securityService.generateSessionToken();

    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + 7); // 7 days

    // Save session to DB
    const session = this.sessionRepository.create({
      user: user,
      access_token: accessToken,
      ref_token: sessionToken,
      expire_at: expireAt.toISOString(),
      client_ip: ip,
    });
    await this.sessionRepository.save(session);

    return {
      message: 'Login successful',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        sessiontoken: sessionToken,
        access_token: accessToken,
      },
    };
  }

  /**
   * Logout user
   */
  async logout(sessionToken: string): Promise<any> {
    const session = await this.sessionRepository.findOne({
      where: { ref_token: sessionToken },
    });

    if (session) {
      await this.sessionRepository.delete(session.id);
    }

    return {
      message: 'Logout successful',
    };
  }

  /**
   * Forgot Password
   */
  async forgotPassword(
    forgotReq: ForgotPasswordRequest,
  ): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({
      where: { email: forgotReq.email },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const resetToken = this.securityService.generateRandomToken(32);
    const expireAt = new Date();
    expireAt.setHours(expireAt.getHours() + 1); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpire = expireAt;
    await this.userRepository.save(user);

    const isAdmin = user.role.name === 'owner';
    const frontendUrl = isAdmin
      ? process.env.ADMIN_URL_DEV || 'http://localhost:3700'
      : process.env.FRONTEND_URL_DEV || 'http://localhost:3300';
    const resetUrl = `${frontendUrl}/reset-password?verify_token=${resetToken}`;

    await this.sendMailService.sendMail(EmailType.RESET_PASSWORD, {
      email: user.email,
      otpCode: resetUrl,
      subjectMessage: 'Reset Your Password',
    });

    return {
      message: 'Password reset token sent to your email.',
    };
  }

  /**
   * Reset Password
   */
  async resetPassword(resetReq: ResetPasswordRequest): Promise<AuthResponse> {
    const validatedReq = this.validationService.validate(
      AuthValidation.RESETPASSWORD,
      resetReq,
    );

    if (validatedReq.password !== validatedReq.retryPassword) {
      throw new HttpException('Passwords do not match', HttpStatus.BAD_REQUEST);
    }

    const user = await this.userRepository.findOne({
      where: {
        passwordResetToken: validatedReq.token,
      },
    });

    if (!user || user.passwordResetExpire < new Date()) {
      throw new HttpException(
        'Invalid or expired reset token',
        HttpStatus.BAD_REQUEST,
      );
    }

    user.password = await this.securityService.hashPassword(
      validatedReq.password,
    );
    user.passwordResetToken = null;
    user.passwordResetExpire = null;
    await this.userRepository.save(user);

    return {
      message: 'Password reset successfully. You can now log in.',
    };
  }

  /**
   * Refresh Access Token using Session Token
   */
  async refreshToken(sessionToken: string): Promise<AuthResponse> {
    const session = await this.sessionRepository.findOne({
      where: { ref_token: sessionToken, is_blocked: false },
      relations: ['user', 'user.role'],
    });

    if (!session) {
      throw new HttpException('Invalid session', HttpStatus.UNAUTHORIZED);
    }

    if (new Date() > new Date(session.expire_at)) {
      throw new HttpException('Session expired', HttpStatus.UNAUTHORIZED);
    }

    const newAccessToken = this.securityService.generateAccessToken();
    session.access_token = newAccessToken;
    await this.sessionRepository.save(session);

    return {
      message: 'Token refreshed successfully',
      data: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role.name,
        createdAt: session.user.createdAt,
        updatedAt: session.user.updatedAt,
        sessiontoken: session.ref_token,
        access_token: session.access_token,
      },
    };
  }

  /**
   * Get Current User
   */
  async getCurrentUser(user: User): Promise<any> {
    return {
      message: 'User profile retrieved',
      data: {
        name: user.name,
        email: user.email,
        role: user.role.name,
      },
    };
  }
}

import { UserRole } from 'src/features/auth/entities/auth.entity';

export class RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export class VerifyOtp {
  otpCode: string;
}

export class LoginRequest {
  email: string;
  password: string;
}

export class VerifyAccount {
  otpCode: string;
  email: string;
}

export class CheckEmail {
  email: string;
}

export class ResetPasswordRequest {
  email: string;
  password: string;
  retryPassword: string;
  otpCode: string;
}

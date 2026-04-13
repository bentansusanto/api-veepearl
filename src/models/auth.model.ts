import { ResponseModel } from "./index.model";

export class RegisterRequest {
  name: string;
  email: string;
  password: string;
  roleId?: number;
  roleName?: string;
}

export class AuthData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  sessiontoken?: string;
  access_token?: string;
}

export class AuthResponse extends ResponseModel<AuthData>{
  message: string;
  data?: AuthData;
  datas?: AuthData[];
}

export class LoginRequest {
  email: string;
  password: string;
}

export class VerifyAccountRequest {
  email?: string;
  token: string;
}

export class ForgotPasswordRequest {
  email: string;
}

export class ResetPasswordRequest {
  email?: string;
  token: string;
  password: string;
  retryPassword: string;
}

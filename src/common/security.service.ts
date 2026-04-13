import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SecurityService {
  /**
   * Generates a random secure token
   * @param bytes Number of random bytes (default 32)
   */
  generateRandomToken(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Hashes a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Verifies a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generates an Access Token (Random Opaque Token)
   */
  generateAccessToken(): string {
    return `at_${this.generateRandomToken(48)}`;
  }

  /**
   * Generates a Session Token (Random Opaque Token)
   */
  generateSessionToken(): string {
    return `st_${this.generateRandomToken(64)}`;
  }
}

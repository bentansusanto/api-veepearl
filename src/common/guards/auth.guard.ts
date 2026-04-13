import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSessions } from '../../features/auth/entities/user_session.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectRepository(UserSessions)
    private readonly sessionRepository: Repository<UserSessions>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    const cookieToken = request.cookies?.['session_token'];

    console.log(`AuthGuard: authHeader=${authHeader}, cookieToken=${cookieToken}`);

    if (!authHeader && !cookieToken) {
      console.log('AuthGuard: Missing both header and cookie');
      throw new UnauthorizedException('Missing or invalid token');
    }

    let session;

    // 1. Try to authenticate via Authorization header (Access Token)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && token !== 'null' && token !== 'undefined') {
        session = await this.sessionRepository.findOne({
          where: { access_token: token, is_blocked: false },
          relations: ['user', 'user.role'],
        });
      }
    }

    // 2. Fallback to session_token cookie (Session Token)
    if (!session && cookieToken && cookieToken !== 'null' && cookieToken !== 'undefined') {
      session = await this.sessionRepository.findOne({
        where: { ref_token: cookieToken, is_blocked: false },
        relations: ['user', 'user.role'],
      });
    }

    if (!session || !session.user) {
      console.log('AuthGuard: No valid session found in DB');
      throw new UnauthorizedException('Session not found or expired');
    }

    // Attach user to request
    request.user = session.user;
    request.session = session;

    return true;
  }
}

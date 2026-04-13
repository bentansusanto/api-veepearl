import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSessions } from '../features/auth/entities/user_session.entity';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(UserSessions)
    private readonly sessionRepository: Repository<UserSessions>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const session = await this.sessionRepository.findOne({
      where: { access_token: token, is_blocked: false },
      relations: ['user', 'user.role'],
    });

    if (!session || !session.user) {
      throw new UnauthorizedException('Unauthorized: Invalid or expired session');
    }

    // Check session expiration
    if (new Date() > new Date(session.expire_at)) {
      throw new UnauthorizedException('Session expired');
    }

    req['user'] = session.user;
    req['session'] = session;
    next();
  }
}

import {
    HttpException,
    HttpStatus,
    Injectable,
    NestMiddleware,
    UnauthorizedException,
  } from '@nestjs/common';
  import { Request, Response, NextFunction } from 'express';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { User } from '../features/auth/entities/auth.entity';
  
  @Injectable()
  export class AuthMiddleware implements NestMiddleware {
    constructor(
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
    ) {}
  
    async use(req: Request, res: Response, next: NextFunction) {
      try {
        const authHeader = req.headers.authorization;
        const token =
          authHeader && authHeader.startsWith('Bearer')
            ? authHeader.split(' ')[1]
            : null;
  
        if (!token) {
          throw new HttpException('No token provided', HttpStatus.UNAUTHORIZED);
        }
  
        const authToken = authHeader.split(' ')[1]; // Mengambil authToken setelah "Bearer "
        const user = await this.userRepository.findOne({
          where: { accToken: authToken },
        });
  
        if (!user) {
          throw new UnauthorizedException('Unauthorized: Invalid auth token');
        }
  
        if (!user.expAccAt || new Date().getTime() > user.expAccAt.getTime()) {
          throw new HttpException('Token expired', HttpStatus.UNAUTHORIZED);
        }
  
        req['user'] = user; // Menyimpan data user dalam request
        next(); // Lanjut ke endpoint berikutnya
      } catch (error) {
        throw new UnauthorizedException(error.message || 'Unauthorized request');
      }
    }
  }
  
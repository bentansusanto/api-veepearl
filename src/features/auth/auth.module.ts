import { Module, OnModuleInit } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from './user/user.module';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/auth.entity';
import { ValidationService } from '../../common/validation.service';
import { SendMailService } from '../../common/send-mail.service';
import { UserService } from './user/user.service';
import { SecurityService } from '../../common/security.service';
import { Role } from './entities/role.entity';
import { UserSessions } from './entities/user_session.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Repository } from 'typeorm';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    ValidationService,
    SendMailService,
    UserService,
    SecurityService,
    AuthGuard,
    RolesGuard,
  ],
  imports: [UserModule, TypeOrmModule.forFeature([User, Role, UserSessions])],
  exports: [AuthService, SecurityService, AuthGuard, RolesGuard],
})
export class AuthModule implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    const roles = ['admin', 'owner', 'customer', 'developer'];
    for (const roleName of roles) {
      const exists = await this.roleRepository.findOne({
        where: { name: roleName },
      });
      if (!exists) {
        await this.roleRepository.save(
          this.roleRepository.create({ name: roleName }),
        );
        console.log(`Role seeded: ${roleName}`);
      }
    }
  }
}


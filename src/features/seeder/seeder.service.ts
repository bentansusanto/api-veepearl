import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Hashids from 'hashids';
import { Repository } from 'typeorm';
import { SecurityService } from '../../common/security.service';
import { User } from '../auth/entities/auth.entity';
import { Role } from '../auth/entities/role.entity';

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    private readonly securityService: SecurityService,
  ) {}

  private hashIds = new Hashids(process.env.ID_SECRET, 20);

  async onModuleInit() {
    await this.seedDeveloperUser();
  }

  async seedDeveloperUser() {
    const email = 'travelindo@gmail.com';
    const password = 'Testing1!';
    const roleName = 'developer';

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      console.log(`Developer user ${email} already exists.`);
      return;
    }

    const role = await this.roleRepository.findOne({
      where: { name: roleName },
    });

    if (!role) {
      console.error(`Role '${roleName}' not found. Skipping developer seeding.`);
      return;
    }

    const hashedPassword = await this.securityService.hashPassword(password);

    const newUser = this.userRepository.create({
      id: this.hashIds.encode(Date.now()),
      email,
      password: hashedPassword,
      name: 'Developer Travelindo',
      role: role,
      isVerified: true,
      isActive: true,
    });

    await this.userRepository.save(newUser);
    console.log(`Developer user ${email} seeded successfully.`);
  }
}

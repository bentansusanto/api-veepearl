import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ValidationService } from '../../../common/validation.service';
import { Logger } from 'winston';
import { Jeweltype } from './entities/jeweltype.entity';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../../features/auth/entities/auth.entity';
import Hashids from 'hashids';
import { JewelRequest, UpdateJewelRequest } from 'src/models/jewel.model';
import { JewelTypeValidation } from './validation/jeweltype.validation';

@Injectable()
export class JeweltypeService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly validationService: ValidationService,
    @InjectRepository(Jeweltype)
    private readonly jeweltypeRepository: Repository<Jeweltype>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private hashIds = new Hashids(process.env.ID_SECRET, 20);
  // generate slug
  private generatedType(name: string): string {
    return name
      .toLowerCase() // Mengubah semua huruf menjadi huruf kecil
      .replace(/\s+/g, '-') // Mengubah spasi menjadi tanda hubung (-)
      .replace(/[^\w-]+/g, '') // Menghapus karakter non-alfanumerik selain tanda hubung
      .replace(/--+/g, '-') // Mengganti beberapa tanda hubung berturut-turut dengan satu tanda hubung
      .replace(/^-+/, '') // Menghapus tanda hubung di awal string
      .replace(/-+$/, ''); // Menghapus tanda hubung di akhir string
  }

  // create jeweltype
  async createJeweltype(userId: string, jewelReq: JewelRequest): Promise<any> {
    try {
      let createReq: JewelRequest;
      try {
        createReq = await this.validationService.validate(
          JewelTypeValidation.CREATEJEWELTYPE,
          jewelReq,
        );
      } catch (error: any) {
        this.logger.error('Invalid create jeweltype request');
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }

      // find user as admin and find jeweltype
      const [findAdmin, findJeweltype] = await Promise.all([
        this.userRepository.findOne({
          where: {
            id: userId,
            role: UserRole.ADMIN,
          },
        }),
        this.jeweltypeRepository.findOne({
          where: {
            name_type: createReq.name_type,
          },
        }),
      ]);

      // check if user is admin
      if (!findAdmin) {
        this.logger.error('User is not admin');
        throw new HttpException('User is not admin', HttpStatus.FORBIDDEN);
      }
      // check if jeweltype already exists
      if (findJeweltype) {
        this.logger.error('Jeweltype already exists');
        throw new HttpException(
          'Jeweltype already exists',
          HttpStatus.CONFLICT,
        );
      }
      // create jeweltype
      const newJeweltype = this.jeweltypeRepository.create({
        id: this.hashIds.encode(Date.now()),
        name_type: createReq.name_type,
        type: this.generatedType(createReq.name_type),
      });
      await this.jeweltypeRepository.save(newJeweltype);

      this.logger.info({
        message: 'Jeweltype created successfully',
        data: newJeweltype,
      });
      return {
        message: 'Jeweltype created successfully',
        data: newJeweltype,
      };
    } catch (error: any) {
      this.logger.error('Failed to create jeweltype', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create jeweltype',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // find all jeweltype
  async findAllJeweltype(): Promise<any> {
    try {
      const findJeweltype = await this.jeweltypeRepository.find();
      // check if jeweltype exists
      if (findJeweltype.length <= 0) {
        this.logger.error('Jeweltype not found');
        throw new HttpException('Jeweltype not found', HttpStatus.NOT_FOUND);
      }
      this.logger.info({
        message: 'Jeweltype found successfully',
        data: findJeweltype,
      });
      return {
        message: 'Jeweltype found successfully',
        data: findJeweltype,
      };
    } catch (error: any) {
      this.logger.error('Failed to find all jeweltype', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to find all jeweltype',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // find jeweltype by id
  async findJeweltype(jewelId: string): Promise<any> {
    try {
      const findJeweltype = await this.jeweltypeRepository.findOne({
        where: {
          id: jewelId,
        },
      });
      // check if jeweltype exists
      if (!findJeweltype) {
        this.logger.error('Jeweltype not found');
        throw new HttpException('Jeweltype not found', HttpStatus.NOT_FOUND);
      }
      this.logger.info({
        message: 'Jeweltype found successfully',
        data: findJeweltype,
      });
      return {
        message: 'Jeweltype found successfully',
        data: findJeweltype,
      };
    } catch (error: any) {
      this.logger.error('Failed to find jeweltype', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to find jeweltype',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // update jeweltype
  async updateJeweltype(
    userId: string,
    jewelId: string,
    jewelReq: UpdateJewelRequest,
  ): Promise<any> {
    try {
      let updateReq: UpdateJewelRequest;
      try {
        updateReq = await this.validationService.validate(
          JewelTypeValidation.UPDATEJEWELTYPE,
          jewelReq,
        );
      } catch (error: any) {
        this.logger.error('Invalid update jeweltype request');
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      const [findAdmin, findJeweltype] = await Promise.all([
        this.userRepository.findOne({
          where: {
            id: userId,
            role: UserRole.ADMIN,
          },
        }),
        this.jeweltypeRepository.findOne({
          where: {
            id: jewelId,
          },
        }),
      ]);
      // check if user is admin
      if (!findAdmin) {
        this.logger.error('User is not admin');
        throw new HttpException('User is not admin', HttpStatus.FORBIDDEN);
      }
      // check if jeweltype exists
      if (!findJeweltype) {
        this.logger.error('Jeweltype not found');
        throw new HttpException('Jeweltype not found', HttpStatus.NOT_FOUND);
      }
      // update jeweltype
      findJeweltype.name_type = updateReq.name_type || findJeweltype.name_type;
      findJeweltype.type = this.generatedType(updateReq.name_type) || findJeweltype.type;
      await this.jeweltypeRepository.save(findJeweltype);
      this.logger.info({
        message: 'Jeweltype updated successfully',
        data: findJeweltype,
      });
      return {
        message: 'Jeweltype updated successfully',
        data: findJeweltype,
      };
    } catch (error: any) {
      this.logger.error('Failed to update jeweltype', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update jeweltype',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // remove jeweltype
  async removeJeweltyp(userId: string, jewelId: string): Promise<any> {
    try {
      const [findAdmin, findJeweltype] = await Promise.all([
        this.userRepository.findOne({
          where: {
            id: userId,
            role: UserRole.ADMIN,
          },
        }),
        this.jeweltypeRepository.findOne({
          where: {
            id: jewelId,
          },
        }),
      ]);
      // check if user is admin
      if (!findAdmin) {
        this.logger.error('User is not admin');
        throw new HttpException('User is not admin', HttpStatus.FORBIDDEN);
      }
      // check if jeweltype exists
      if (!findJeweltype) {
        this.logger.error('Jeweltype not found');
        throw new HttpException('Jeweltype not found', HttpStatus.NOT_FOUND);
      }
      // remove jeweltype
      await this.jeweltypeRepository.remove(findJeweltype);
      this.logger.info({
        message: 'Jeweltype removed successfully',
        data: findJeweltype,
      });
      return {
        message: 'Jeweltype removed successfully',
        data: findJeweltype,
      };
    } catch (error: any) {
      this.logger.error('Failed to remove jeweltype', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to remove jeweltype',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ValidationService } from '../../common/validation.service';
import { Logger } from 'winston';
import { Pemesan } from './entities/pemesan.entity';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/auth.entity';
import Hashids from 'hashids';
import { PemesanRequest, UpdatePemesanRequest } from '../../models/pemesan.model';
import { PemesanValidation } from './validation/pemesan.validation';


@Injectable()
export class PemesanService {
  constructor(
    private readonly validationService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger:Logger,
    @InjectRepository(Pemesan) private pemesanRepository: Repository<Pemesan>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}
  private hashIds = new Hashids(process.env.ID_SECRET, 20)

  // create pemesan 
  async createPemesan(userId: string, pemesanReq: PemesanRequest):Promise<any> {
    try {
      let createReq: PemesanRequest;
      try {
        createReq = this.validationService.validate(
          PemesanValidation.CREATEPEMESAN,
          pemesanReq,
        )
      } catch (error:any) {
        this.logger.error('Failed to validate pemesan request');
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }

      const [findUser, pemesan] = await Promise.all([
        this.userRepository.findOne({ where: { id: userId } }),
        this.pemesanRepository.findOne({
          where: {
            email: createReq.email,
          },
          relations: ['user']
        }),
      ]);
      // check if user not found
      if(!findUser){
        this.logger.error('User not found');
        throw new HttpException('User not found', HttpStatus.NOT_FOUND)
      }
      // check if email already exists
      if(pemesan){
        this.logger.error('Email already exists');
        throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST)
      }
      // create pemesan
      const newPemesan = this.pemesanRepository.create({
        id: this.hashIds.encode(Date.now()),
        ...createReq,
        email: createReq.email,
        user: {
          id: userId,
        },
      });
      await this.pemesanRepository.save(newPemesan);

      this.logger.info({
        message: 'Successfully created pemesan',
        data: {
          id: newPemesan.id,
          email: newPemesan.email,
          name: newPemesan.name,
          phone: newPemesan.phone,
          address: newPemesan.address,
          city: newPemesan.city,
          country: newPemesan.country,
          zip_code: newPemesan.zip_code,
          userId: {
            id: newPemesan.user.id,
          }
        }
      })

      return {
        message: 'Successfully created pemesan',
        data: {
          id: newPemesan.id,
          email: newPemesan.email,
          name: newPemesan.name,
          phone: newPemesan.phone,
          address: newPemesan.address,
          city: newPemesan.city,
          country: newPemesan.country,
          zip_code: newPemesan.zip_code,
          userId: {
            id: newPemesan.user.id,
          }
        }
      }
    } catch (error: any) {
      this.logger.error('Failed to create pemesan', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to create pemesan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // find all pemesan by user
  async findAllPemesan(userId: string):Promise<any> {
    try {
      const findPemesan = await this.pemesanRepository.find({
        where: {
          user: {
            id: userId,
          },
        },
      });
      // check if pemesan not found
      if(!findPemesan || findPemesan.length === 0){
        this.logger.error('Pemesan not found');
        throw new HttpException('Pemesan not found', HttpStatus.NOT_FOUND)
      }
      this.logger.info({
        message: 'Successfully find pemesan',
        data: findPemesan,
      })
      return {
        message: 'Successfully find pemesan',
        data: findPemesan,
      }
    } catch (error: any) {
      this.logger.error('Failed to find pemesan', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to find pemesan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // find pemesan by id and user 
  async findPemesanId(userId: string, pemesanId: string):Promise<any> {
    try {
      const findPemesan = await this.pemesanRepository.findOne({
        where: {
          id: pemesanId,
          user: {
            id: userId,
          },
        },
        relations: ['user']
      })
      // check if pemesan not found
      if(!findPemesan || findPemesan.user.id !== userId){
        this.logger.error('Pemesan not found or user not found');
        throw new HttpException('Pemesan not found or user not found', HttpStatus.NOT_FOUND)
      }

      this.logger.info({
        message: 'Successfully find pemesan',
        data: findPemesan,
      })

      return {
        message: 'Successfully find pemesan',
        data: findPemesan,
      }
    } catch (error: any) {
      this.logger.error('Failed to find pemesan', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to find pemesan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // update pemesan by id and user
  async updatePemesan(userId: string, pemesanId: string, pemesanReq: UpdatePemesanRequest): Promise<any> {
    try {
      let updateReq: UpdatePemesanRequest;
      try {
        updateReq = this.validationService.validate(
          PemesanValidation.UPDATEPEMESAN,
          pemesanReq,
        )
      } catch (error: any) {
        this.logger.error('Failed to validate pemesan request');
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }

      const [findUser, findPemesan] = await Promise.all([
        this.userRepository.findOne({ where: { id: userId } }),
        this.pemesanRepository.findOne({ where: { id: pemesanId, user: { id: userId } } }),
      ]);
      // check if user not found
      if(!findUser){
        this.logger.error('User not found');
        throw new HttpException('User not found', HttpStatus.NOT_FOUND)
      }
      // check if user not found
      if(!findPemesan || findPemesan.user.id !== userId){
        this.logger.error('Pemesan not found or user not found');
        throw new HttpException('Pemesan not found or user not found', HttpStatus.NOT_FOUND)
      }

      // update pemesan
      const updatePemesan = await this.pemesanRepository.save({
        ...findPemesan,
        ...updateReq,
      })
      this.logger.info({
        message: 'Successfully update pemesan',
        data: updatePemesan,
      })
      return {
        message: 'Successfully update pemesan',
        data: updatePemesan,
      }
    } catch (error:any) {
      this.logger.error('Failed to update pemesan', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update pemesan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // remove pemesan by id and user
  async removePemesan(userId: string, pemesanId: string):Promise<any> {
    try {
      const [findUser, findPemesan] = await Promise.all([
        this.userRepository.findOne({ where: { id: userId } }),
        this.pemesanRepository.findOne({ where: { id: pemesanId, user: { id: userId } } }),
      ]);
      // check if user not found
      if(!findUser){
        this.logger.error('User not found');
        throw new HttpException('User not found', HttpStatus.NOT_FOUND)
      }
      // check if pemesan not found
      if(!findPemesan || findPemesan.user.id!== userId){
        this.logger.error('Pemesan not found or user not found');
        throw new HttpException('Pemesan not found or user not found', HttpStatus.NOT_FOUND)
      }
      // remove pemesan
      await this.pemesanRepository.remove(findPemesan);
      this.logger.info({
        message: 'Successfully remove pemesan',
      })
      return {
        message: 'Successfully remove pemesan',
      }
    } catch (error: any) {
      this.logger.error('Failed to remove pemesan', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to remove pemesan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );   
    }
  }
}

import { Injectable } from '@nestjs/common';
import { CreateJeweltypeDto } from './dto/create-jeweltype.dto';
import { UpdateJeweltypeDto } from './dto/update-jeweltype.dto';

@Injectable()
export class JeweltypeService {
  create(createJeweltypeDto: CreateJeweltypeDto) {
    return 'This action adds a new jeweltype';
  }

  findAll() {
    return `This action returns all jeweltype`;
  }

  findOne(id: number) {
    return `This action returns a #${id} jeweltype`;
  }

  update(id: number, updateJeweltypeDto: UpdateJeweltypeDto) {
    return `This action updates a #${id} jeweltype`;
  }

  remove(id: number) {
    return `This action removes a #${id} jeweltype`;
  }
}

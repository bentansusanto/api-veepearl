import { PartialType } from '@nestjs/mapped-types';
import { CreateJeweltypeDto } from './create-jeweltype.dto';

export class UpdateJeweltypeDto extends PartialType(CreateJeweltypeDto) {}

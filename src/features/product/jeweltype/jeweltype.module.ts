import { Module } from '@nestjs/common';
import { JeweltypeService } from './jeweltype.service';
import { JeweltypeController } from './jeweltype.controller';

@Module({
  controllers: [JeweltypeController],
  providers: [JeweltypeService],
})
export class JeweltypeModule {}

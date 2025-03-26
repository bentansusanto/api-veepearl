import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { JeweltypeModule } from './jeweltype/jeweltype.module';

@Module({
  controllers: [ProductController],
  providers: [ProductService],
  imports: [JeweltypeModule],
})
export class ProductModule {}

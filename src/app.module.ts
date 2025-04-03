import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { AuthModule } from './features/auth/auth.module';
import { ProductModule } from './features/product/product.module';
import { JeweltypeModule } from './features/product/jeweltype/jeweltype.module';
import { CartModule } from './features/cart/cart.module';

@Module({
  imports: [CommonModule, AuthModule, ProductModule, JeweltypeModule, CartModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

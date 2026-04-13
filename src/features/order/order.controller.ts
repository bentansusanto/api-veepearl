import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  Param,
  // Delete,
  HttpCode,
  HttpStatus,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { Request } from 'express';
import { OrderRequest } from '../../models/order.model';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('api/v1/')
@UseGuards(AuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // create order product
  @Post('create_order_product_paypal')
  @HttpCode(HttpStatus.CREATED)
  async createOrderPaypal(
    @Req() req: Request,
    @Body() orderReq: OrderRequest,
  ): Promise<any> {
    const userId = req['user'].id;
    const result = await this.orderService.createOrderPaypal(userId, orderReq);
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Post('create_order_product_cod')
  @HttpCode(HttpStatus.CREATED)
  async createOrderCod(
    @Req() req: Request,
    @Body() orderReq: OrderRequest,
  ): Promise<any> {
    const userId = req['user'].id;
    const result = await this.orderService.createOrderCod(userId, orderReq);
    return {
      message: result.message,
      data: result.data,
    };
  }

  // capture payment paypal
  @Post('capture_payment_paypal')
  @HttpCode(HttpStatus.OK)
  async capturePaymentPaypal(
    @Req() req: Request,
    @Query('token') token: string,
  ): Promise<any> {
    const userId = req['user'].id;
    const result = await this.orderService.capturePayment(userId, token);
    return {
      message: result.message,
      data: result.data,
    };
  }

  // verify payment paypal
  @Get('verify_payment_paypal')
  @HttpCode(HttpStatus.OK)
  async verifyPaymentPaypal(
    @Req() req: Request,
    @Query('token') token: string,
  ): Promise<any> {
    const userId = req['user'].id;
    const result = await this.orderService.verifyPaypalPayment(userId, token);
    return {
      message: result.message,
      data: result.data,
    };
  }

  // verify payment cod
  @Get('verify_payment_cod/:id')
  @HttpCode(HttpStatus.OK)
  async verifyPaymentCOD(
    @Req() req: Request,
    @Param('id') orderId: string,
  ): Promise<any> {
    const userId = req['user'].id;
    const result = await this.orderService.verifyCODPayment(userId, orderId);
    return {
      message: result.message,
      data: result.data,
    };
  }

  @Post('create_order_product_card')
  @HttpCode(HttpStatus.CREATED)
  async createOrderCard(
    @Req() req: Request,
    @Body() orderReq: OrderRequest,
  ): Promise<any> {
    const userId = req['user'].id;
    const result = await this.orderService.createOrderByCard(userId, orderReq);
    return {
      message: result.message,
      data: result.data,
    };
  }

  // @Post('capture_payment_card')
  // @HttpCode(HttpStatus.OK)
  // async capturePaymentCard(
  //   @Req() req: Request,
  //   @Body() paymentReq: CapturePaymentRequest,
  // ): Promise<any> {
  //   const user = req['user'];
  //   if (!user) {
  //     throw new HttpException(' Unauthorized', HttpStatus.UNAUTHORIZED);
  //   }
  //   const userId = user.id;
  //   const result = await this.orderService.capturePaymentByCard(
  //     userId,
  //     paymentReq,
  //   );
  //   return {
  //     message: result.message,
  //     data: result.data,
  //   };
  // }

  // find order by user
  @Get('find_history_order')
  @HttpCode(HttpStatus.OK)
  async findAllPayment(@Req() req: Request): Promise<any> {
    const userId = req['user'].id;
    const result = await this.orderService.findAllOrderByUser(userId);
    return {
      message: result.message,
      data: result.data,
    };
  }

  // find order user by admin
  @Get('find_order_user')
  @HttpCode(HttpStatus.OK)
  async findAllPaymentUser(@Req() req: Request): Promise<any> {
    const userId = req['user'].id;
    const result = await this.orderService.findAllOrderByAdmin(userId);
    return {
      message: result.message,
      data: result.data,
    };
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.orderService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string) {
  //   return;
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.orderService.remove(+id);
  // }
}

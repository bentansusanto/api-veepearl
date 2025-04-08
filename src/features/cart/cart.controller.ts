import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  Req,
  HttpException,
  Put,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { Request } from 'express';
import { CartRequest, UpdateCartRequest } from '../../models/cart.model';


@Controller('api/v1/')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // add cart
  @Post('add_cart')
  @HttpCode(HttpStatus.CREATED)
  async createCart(@Req() req:Request, @Body() cartReq: CartRequest):Promise<any>  {
    const user = req['user']
    if(!user){
      throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED)
    }
    const userId = user.id
    const result = await this.cartService.addCart(userId, cartReq)
    return{
      message: result.message,
      data: result.data,
    }
  }

  // find all products in cart by use
  @Get('find_cart')
  @HttpCode(HttpStatus.OK)
  async findCart(@Req() req:Request):Promise<any> {
    const user = req['user']
    if(!user){
      throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED)
    }
    const userId = user.id
    const result = await this.cartService.findCart(userId)
    return{
      message: result.message,
      data: result.data,
    }
  }

  // find cart by id
  // @Get(':id')
  // async findOne(@Param('id') id: string) {
  //   return this.cartService.findOne(+id);
  // }

  @Put('update_product_cart/:id')
  @HttpCode(HttpStatus.OK)
  async updatedCart(@Req() req: Request, @Param('id') cartId: string,  @Body() quantity: number):Promise<any>  {
    const user = req['user']
    if(!user){
      throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED)
    }
    const userId = user.id
    const result = await this.cartService.updateCart(userId, cartId, quantity)
    return{
      message: result.message,
      data: result.data,
    }
  }

  @Delete('remove_product_cart/:id')
  @HttpCode(HttpStatus.OK)
  async removeCart(@Req() req: Request, @Param('id') cartId: string):Promise<any>   {
    const user = req['user']
    if(!user){
      throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED)
    }
    const userId = user.id
    const result = await this.cartService.removeFromCart(userId, cartId)
    return{
      message: result.message,
    }
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  Req,
  Put,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductRequest, UpdateProductRequest } from '../../models/product.model';
import { Request } from 'express';


@Controller('api/v1/')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // create product
  @Post('create_product')
  @HttpCode(HttpStatus.CREATED)
  async createProduct(@Req() req: Request, @Body() productReq: ProductRequest):Promise<any>  {
    const user = req['user']
    if(!user){
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
      }
    }
    const userId = user.id
    const result = await this.productService.createProduct(userId, productReq);
    return{
      message: result.message,
      data: result.data,
    }
  }

  // find all product
  @Get('products')
  @HttpCode(HttpStatus.OK)
  async findAllProduct():Promise<any> {
    const result = await this.productService.findAllProduct();
    return{
      message: result.message,
      data: result.data,
    }
  }

  // find product by id
  @Get('products/:id')
  async findProductId(@Param('id') productId: string):Promise<any>  {
    const result = await this.productService.findProduct(productId);
    return{
      message: result.message,
      data: result.data,
    }
  }

  // update product
  @Put('update_product/:id')
  @HttpCode(HttpStatus.OK)
  async updateProduct(@Req() req:Request, @Param('id') productId: string, @Body() productReq: UpdateProductRequest):Promise<any>  {
    const user = req['user']
    if(!user){
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
      }
    }
    const userId = user.id
    const result = await this.productService.updateProduct(userId, productId, productReq);
    return{
      message: result.message,
      data: result.data,
    }
  }

  // delete product
  @Delete('delete_product/:id')
  @HttpCode(HttpStatus.OK)
  async removeProduct(@Req() req: Request, @Param('id') productId: string): Promise<any>  {
    const user = req['user']
    if(!user){
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
      }
    }
    const userId = user.id
    const result = await this.productService.removeProduct(userId, productId);
    return {
      message: result.message,
      data: result.data,
    }
  }
}

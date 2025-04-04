import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Req,
  HttpException,
  Put,
} from '@nestjs/common';
import { PemesanService } from './pemesan.service';
import { PemesanRequest, UpdatePemesanRequest } from '../../models/pemesan.model';


@Controller('api/v1/')
export class PemesanController {
  constructor(private readonly pemesanService: PemesanService) {}

  // create pemesan
  @Post('create_pemesan')
  @HttpCode(HttpStatus.CREATED)
  async createPemesan(@Req() req:Request, @Body() pemesanReq: PemesanRequest):Promise<any>  {
    const user = req['user']
    if(!user){
      throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED)
    }
    const userId = user.id
    const result = await this.pemesanService.createPemesan(userId, pemesanReq)
    return{
      message: result.message,
      data: result.data,
    }
  }

  // find all pemesan
  @Get('find_all_pemesan')
  @HttpCode(HttpStatus.OK)
  async findAllPemesan(@Req() req: Request):Promise<any>  {
    const user = req['user']
    if(!user){
      throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED)
    }
    const userId = user.id
    const result = await this.pemesanService.findAllPemesan(userId)
    return{
      message: result.message,
      data: result.data,
    }
  }

  // find pemesan by id
  @Get('find_pemesan/:id')
  @HttpCode(HttpStatus.OK)
  async findPemesanId(@Req() req:Request, @Param('id') pemesanId: string):Promise<any>   {
    const user = req['user']
    if(!user){
      throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED)
    }
    const userId = user.id
    const result = await this.pemesanService.findPemesanId(userId, pemesanId)
    return{
      message: result.message,
      data: result.data,
    }
  }

  // update pemesan by id
  @Put('update_pemesan/:id')
  @HttpCode(HttpStatus.OK)
  async updatePemesan(@Req() req: Request, @Param('id') pemesanId: string, @Body() pemesanReq: UpdatePemesanRequest):Promise<any>    {
    const user = req['user']
    if(!user){
      throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED)
    }
    const userId = user.id
    const result = await this.pemesanService.updatePemesan(userId, pemesanId, pemesanReq)
    return{
      message: result.message,
      data: result.data,
    }
  }

  // delete pemesan by id
  @Delete('delete_pemesan/:id')
  @HttpCode(HttpStatus.OK)
  async removePemesan(@Req() req:Request, @Param('id') pemesanId: string):Promise<any>    {
    const user = req['user']
    if(!user){
      throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED)
    }
    const userId = user.id
    const result = await this.pemesanService.removePemesan(userId, pemesanId)
    return{
      message: result.message,
      data: result.data,
    }
  }
}

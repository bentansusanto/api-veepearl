import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JewelRequest, UpdateJewelRequest } from '../../../models/jewel.model';
import { JeweltypeService } from './jeweltype.service';

@Controller('api/v1/')
export class JeweltypeController {
  constructor(private readonly jeweltypeService: JeweltypeService) {}

  // create jeweltype
  @Post('create_jeweltype')
  @HttpCode(HttpStatus.CREATED)
  async createJeweltype(
    @Req() req: Request,
    @Body() jewelReq: JewelRequest,
  ): Promise<any> {
    const user = req['user'];
    if (!user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const userId = user.id;
    const result = await this.jeweltypeService.createJeweltype(
      userId,
      jewelReq,
    );
    return {
      message: result.message,
      data: result.data,
    };
  }

  // get all jeweltype
  @Get('jeweltypes')
  @HttpCode(HttpStatus.OK)
  async findAllJeweltype(): Promise<any> {
    const result = await this.jeweltypeService.findAllJeweltype();
    return {
      message: result.message,
      data: result.data,
    };
  }

  // get jeweltype by id
  @Get('jeweltypes/:id')
  @HttpCode(HttpStatus.OK)
  async findJeweltypeById(@Param('id') jewelId: string): Promise<any> {
    const result = await this.jeweltypeService.findJeweltype(jewelId);
    return {
      message: result.message,
      data: result.data,
    };
  }

  // update jeweltype
  @Put('update_jeweltype/:id')
  @HttpCode(HttpStatus.OK)
  async updateJeweltype(
    @Req() req: Request,
    @Param('id') jewelId: string,
    @Body() jewelReq: UpdateJewelRequest,
  ): Promise<any> {
    const user = req['user'];
    if (!user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const userId = user.id;
    const result = await this.jeweltypeService.updateJeweltype(
      userId,
      jewelId,
      jewelReq,
    );
    return {
      message: result.message,
      data: result.data,
    };
  }

  // delete jeweltype
  @Delete('delete_jeweltype/:id')
  @HttpCode(HttpStatus.OK)
  async removeJeweltype(
    @Req() req: Request,
    @Param('id') jewelId: string,
  ): Promise<any> {
    const user = req['user'];
    if (!user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    const userId = user.id;
    const result = await this.jeweltypeService.removeJeweltyp(userId, jewelId);
    return {
      message: result.message,
      data: result.data,
    };
  }
}

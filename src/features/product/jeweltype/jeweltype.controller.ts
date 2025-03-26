import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { JeweltypeService } from './jeweltype.service';
import { CreateJeweltypeDto } from './dto/create-jeweltype.dto';
import { UpdateJeweltypeDto } from './dto/update-jeweltype.dto';

@Controller('jeweltype')
export class JeweltypeController {
  constructor(private readonly jeweltypeService: JeweltypeService) {}

  @Post()
  create(@Body() createJeweltypeDto: CreateJeweltypeDto) {
    return this.jeweltypeService.create(createJeweltypeDto);
  }

  @Get()
  findAll() {
    return this.jeweltypeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jeweltypeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateJeweltypeDto: UpdateJeweltypeDto) {
    return this.jeweltypeService.update(+id, updateJeweltypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jeweltypeService.remove(+id);
  }
}

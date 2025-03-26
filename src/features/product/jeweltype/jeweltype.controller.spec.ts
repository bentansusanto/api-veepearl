import { Test, TestingModule } from '@nestjs/testing';
import { JeweltypeController } from './jeweltype.controller';
import { JeweltypeService } from './jeweltype.service';

describe('JeweltypeController', () => {
  let controller: JeweltypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JeweltypeController],
      providers: [JeweltypeService],
    }).compile();

    controller = module.get<JeweltypeController>(JeweltypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

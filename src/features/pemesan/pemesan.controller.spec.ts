import { Test, TestingModule } from '@nestjs/testing';
import { PemesanController } from './pemesan.controller';
import { PemesanService } from './pemesan.service';

describe('PemesanController', () => {
  let controller: PemesanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PemesanController],
      providers: [PemesanService],
    }).compile();

    controller = module.get<PemesanController>(PemesanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

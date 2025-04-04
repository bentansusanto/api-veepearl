import { Test, TestingModule } from '@nestjs/testing';
import { PemesanService } from './pemesan.service';

describe('PemesanService', () => {
  let service: PemesanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PemesanService],
    }).compile();

    service = module.get<PemesanService>(PemesanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

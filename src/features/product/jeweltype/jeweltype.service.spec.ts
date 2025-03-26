import { Test, TestingModule } from '@nestjs/testing';
import { JeweltypeService } from './jeweltype.service';

describe('JeweltypeService', () => {
  let service: JeweltypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JeweltypeService],
    }).compile();

    service = module.get<JeweltypeService>(JeweltypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

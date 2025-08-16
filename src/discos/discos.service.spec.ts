import { Test, TestingModule } from '@nestjs/testing';
import { DiscosService } from './discos.service';

describe('DiscosService', () => {
  let service: DiscosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiscosService],
    }).compile();

    service = module.get<DiscosService>(DiscosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

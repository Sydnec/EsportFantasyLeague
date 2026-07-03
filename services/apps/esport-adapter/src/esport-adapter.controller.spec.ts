import { Test, TestingModule } from '@nestjs/testing';
import { EsportAdapterController } from './esport-adapter.controller';
import { EsportAdapterService } from './esport-adapter.service';

describe('EsportAdapterController', () => {
  let esportAdapterController: EsportAdapterController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [EsportAdapterController],
      providers: [EsportAdapterService],
    }).compile();

    esportAdapterController = app.get<EsportAdapterController>(EsportAdapterController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(esportAdapterController.getHello()).toBe('Hello World!');
    });
  });
});

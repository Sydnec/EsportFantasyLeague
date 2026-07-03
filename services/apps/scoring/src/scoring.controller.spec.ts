import { Test, TestingModule } from '@nestjs/testing';
import { ScoringController } from './scoring.controller';
import { ScoringService } from './scoring.service';

describe('ScoringController', () => {
  let scoringController: ScoringController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ScoringController],
      providers: [ScoringService],
    }).compile();

    scoringController = app.get<ScoringController>(ScoringController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(scoringController.getHello()).toBe('Hello World!');
    });
  });
});

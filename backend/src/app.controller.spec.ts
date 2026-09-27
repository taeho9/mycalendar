import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return service message', () => {
      expect(appController.getHello()).toBe(
        'MyCalendar Collaboration API Server is running!',
      );
    });

    it('should return health check status with timezone', () => {
      const res = appController.getHealth();
      expect(res.status).toBe('ok');
      expect(res.timezone).toBeDefined();
      expect(res.timestamp).toBeDefined();
    });
  });
});

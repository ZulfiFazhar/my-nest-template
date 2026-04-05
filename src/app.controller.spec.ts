import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { wrapResponse } from './common/utils/response.util';

// Type for mock response
interface MockResponse {
  message: string;
  data: unknown;
}

jest.mock('./common/utils/response.util');

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);

    (wrapResponse as jest.Mock).mockImplementation(
      (message: string, data: unknown): MockResponse => ({
        message,
        data,
      }),
    );
  });

  describe('root', () => {
    it('should return wrapped response with Hello World!', () => {
      const result = appController.getHello();

      expect(result).toEqual({
        message: 'Hello World!',
        data: {
          message: 'Hello World!',
        },
      });
    });
  });
});

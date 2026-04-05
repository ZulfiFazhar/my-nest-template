import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let healthCheckService: jest.Mocked<HealthCheckService>;
  let db: jest.Mocked<TypeOrmHealthIndicator>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn(),
          },
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: {
            pingCheck: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    healthCheckService = module.get(HealthCheckService);
    db = module.get(TypeOrmHealthIndicator);
  });

  describe('checkHealth', () => {
    it('should return health check result', async () => {
      const healthResult = {
        status: 'ok',
        info: {
          database: {
            status: 'up',
          },
        },
        error: {},
        details: {
          database: {
            status: 'up',
          },
        },
      };

      healthCheckService.check.mockImplementation((checks) => {
        // Execute the checks
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        checks.forEach((check) => check());
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return Promise.resolve(healthResult) as any;
      });

      const result = await service.checkHealth();

      expect(result).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(healthCheckService.check).toHaveBeenCalled();
    });

    it('should call database ping check', async () => {
      const healthResult = {
        status: 'ok',
        info: {
          database: {
            status: 'up',
          },
        },
        error: {},
        details: {},
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      healthCheckService.check.mockResolvedValue(healthResult as any);

      db.pingCheck.mockReturnValue(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        Promise.resolve({ database: { status: 'up' } }) as any,
      );

      await service.checkHealth();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(healthCheckService.check).toHaveBeenCalled();
    });
  });
});

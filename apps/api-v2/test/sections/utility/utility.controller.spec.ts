import { Test, TestingModule } from '@nestjs/testing';
import { GoneException } from '@nestjs/common';
import { UtilityController } from 'src/sections/utility/utility.controller';

describe('UtilityController', () => {
  let utilityController: UtilityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UtilityController],
    }).compile();

    utilityController = module.get<UtilityController>(UtilityController);
  });


  describe('getHealth', () => {
    it('should return health status', async () => {
      const result = await utilityController.getHealth();

      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();

      // ensure timestamp is valid ISO string
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });

  
  describe('getVersion', () => {
    it('should return version info', async () => {
      const result = await utilityController.getVersion();

      expect(result).toEqual(
        expect.objectContaining({
          apiVersion: 'v2',
        }),
      );

      expect(typeof result.version).toBe('string');
      expect(typeof result.name).toBe('string');
    });

    it('should fallback to "unknown" when env vars are missing', async () => {
      const originalVersion = process.env.npm_package_version;
      const originalName = process.env.npm_package_name;

      delete process.env.npm_package_version;
      delete process.env.npm_package_name;

      const result = await utilityController.getVersion();

      expect(result.version).toBe('unknown');
      expect(result.name).toBe('unknown');

      // restore env
      process.env.npm_package_version = originalVersion;
      process.env.npm_package_name = originalName;
    });
  });

  
  describe('getOldRoutes', () => {
    it('should throw GoneException', () => {
      expect(() => utilityController.getOldRoutes()).toThrow(GoneException);

      expect(() => utilityController.getOldRoutes()).toThrow(
        'Deprecated API endpoint. Please use the new API version 2',
      );
    });
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import LandmarkService from '@services/landmarkService.js';
import ResponseHandler from '@utils/responseHandler.js';
import LandmarkController from '@controllers/landmarkController.js';

vi.mock('@services/landmarkService.js', () => ({
  default: vi.fn(function () {
    return {
      CreateLandmark: vi.fn(),
      GetAllLandmarks: vi.fn(),
      GetLandmarkByID: vi.fn(),
      UpdateLandmark: vi.fn(),
      RemoveLandmark: vi.fn(),
    };
  }),
}));

vi.mock('@utils/responseHandler.js', () => ({
  default: {
    send: vi.fn(),
  },
}));

vi.mock('@utils/redisUtils.js', () => ({
  clearCachePattern: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@constants/allConstant.js', () => ({
  HttpConstants: {
    statusCode: {
      OK: { code: 200 },
      CREATED: { code: 201 },
      NOT_FOUND: { code: 404 },
    },
  },
  MessageConstants: {
    responseMessage: {
      landmarkController: {
        landmarksRetrieved: 'Landmarks retrieved successfully',
        landmarkRetrieved: 'Landmark details retrieved successfully',
        landmarkCreated: 'Landmark created successfully',
        landmarkUpdated: 'Landmark updated successfully',
        landmarkRemoved: 'Landmark removed successfully',
      },
    },
  },
}));

const buildReq = (overrides: Partial<Request> = {}): Request =>
  ({
    validatedQuery: {},
    validatedParams: {},
    validatedBody: {},
    ...overrides,
  }) as unknown as Request;

const buildRes = (): Response => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const getMockServiceInstance = () => {
  const MockedClass = vi.mocked(LandmarkService);
  const lastResult = MockedClass.mock.results.at(-1);
  if (!lastResult || lastResult.type !== 'return') {
    throw new Error('Mock instance not found');
  }
  return lastResult.value as any;
};

describe('LandmarkController', () => {
  let controller: LandmarkController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new LandmarkController();
  });

  describe('GetAllLandmarks', () => {
    it('should call landmarkService.GetAllLandmarks and respond with 200', async () => {
      const mockLandmarks = [
        {
          code: 'colosseum',
          name: 'The Colosseum',
          center: { latitude: 41.8902, longitude: 12.4922 },
          widthMeters: 190,
          heightMeters: 155,
        },
      ];

      const req = buildReq({ validatedQuery: { page: 1, limit: 10 } });
      const res = buildRes();

      const mockService = getMockServiceInstance();
      mockService.GetAllLandmarks.mockResolvedValue({
        landmarks: mockLandmarks,
        total: 1,
      });

      await controller.GetAllLandmarks(req, res);

      expect(mockService.GetAllLandmarks).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(ResponseHandler.send).toHaveBeenCalledWith(res, 200, {
        data: mockLandmarks,
        message: 'Landmarks retrieved successfully',
      });
    });
  });

  describe('GetLandmarkByID', () => {
    it('should call landmarkService.GetLandmarkByID and return the landmark', async () => {
      const mockLandmark = {
        code: 'colosseum',
        name: 'The Colosseum',
        center: { latitude: 41.8902, longitude: 12.4922 },
      };

      const req = buildReq({ validatedParams: { id: 'colosseum' } });
      const res = buildRes();

      const mockService = getMockServiceInstance();
      mockService.GetLandmarkByID.mockResolvedValue(mockLandmark);

      await controller.GetLandmarkByID(req, res);

      expect(mockService.GetLandmarkByID).toHaveBeenCalledWith('colosseum');
      expect(ResponseHandler.send).toHaveBeenCalledWith(res, 200, {
        data: mockLandmark,
        message: 'Landmark details retrieved successfully',
      });
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import TicketService from '@services/ticketService.js';
import TicketRepository from '@repositories/ticketRepository.js';

vi.mock('@repositories/ticketRepository.js', () => ({
  default: vi.fn(function () {
    return {
      ValidateAndRedeem: vi.fn(),
      FindByToken: vi.fn(),
      Create: vi.fn(),
      GetAll: vi.fn(),
      GetByID: vi.fn(),
      Update: vi.fn(),
      Remove: vi.fn(),
    };
  }),
}));

const getMockRepoInstance = () => {
  const MockedClass = vi.mocked(TicketRepository);
  const lastResult = MockedClass.mock.results.at(-1);
  if (!lastResult || lastResult.type !== 'return') {
    throw new Error('Mock repository instance not found');
  }
  return lastResult.value as any;
};

describe('TicketService', () => {
  let service: TicketService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TicketService();
  });

  describe('ValidateTicket', () => {
    it('should validate ticket and return payload when token is valid', async () => {
      const mockResult = {
        isValid: true,
        token: 'COL-DEMO-2026',
        tier: 'full_access',
        allowedFloorIds: ['floor_underground', 'floor_1'],
        expiresAt: '2027-12-31T23:59:59.000Z',
      };

      const mockRepo = getMockRepoInstance();
      mockRepo.ValidateAndRedeem.mockResolvedValue(mockResult);

      const result = await service.ValidateTicket('COL-DEMO-2026', 'device-123');

      expect(mockRepo.ValidateAndRedeem).toHaveBeenCalledWith('COL-DEMO-2026', 'device-123');
      expect(result.isValid).toBe(true);
      expect(result.tier).toBe('full_access');
      expect(result.sessionToken).toBeDefined();
    });

    it('should throw BadRequestError if token is invalid or expired', async () => {
      const mockResult = {
        isValid: false,
        reason: 'Ticket token not found.',
      };

      const mockRepo = getMockRepoInstance();
      mockRepo.ValidateAndRedeem.mockResolvedValue(mockResult);

      await expect(service.ValidateTicket('INVALID-TOKEN')).rejects.toThrow(
        'Ticket token not found.'
      );
    });

    it('should throw BadRequestError if token is missing', async () => {
      await expect(service.ValidateTicket('')).rejects.toThrow();
    });
  });
});

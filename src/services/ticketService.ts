import jwt from 'jsonwebtoken';
import TicketRepository from '@repositories/ticketRepository.js';
import * as TicketDTO from '@dtos/ticketDTO.js';
import * as Error from '@errors/concreteErrors.js';
import { MessageConstants, EnvConstant } from '@constants/allConstant.js';

const Message = MessageConstants.errorMessage.ticketService;

export default class TicketService {
  private ticketRepository: TicketRepository;

  constructor() {
    this.ticketRepository = new TicketRepository();
  }

  async ValidateTicket(token?: string, deviceId?: string | null) {
    if (!token) {
      throw new Error.BadRequestError(Message.invalidToken);
    }

    const result = await this.ticketRepository.ValidateAndRedeem(token, deviceId);
    if (!result.isValid) {
      throw new Error.BadRequestError(result.reason || Message.invalidToken);
    }

    const sessionPayload: TicketDTO.TicketSession = {
      ticketToken: result.token!,
      tier: result.tier!,
      allowedFloorIds: result.allowedFloorIds || [],
      deviceId: deviceId || null,
      expiresAt: result.expiresAt!,
    };

    const sessionToken = jwt.sign(sessionPayload, EnvConstant.JWT_SECRET, {
      expiresIn: '24h',
    });

    return {
      ...result,
      sessionToken,
    };
  }

  async CreateTicket(data: TicketDTO.CreateTicket): Promise<TicketDTO.Ticket> {
    const existing = await this.ticketRepository.FindByToken(data.token);
    if (existing) {
      throw new Error.ConflictError('Ticket token already exists');
    }
    return this.ticketRepository.Create(data);
  }

  async GetAllTickets(query: TicketDTO.QueryTicket): Promise<{
    tickets: TicketDTO.Ticket[];
    total: number;
  }> {
    return this.ticketRepository.GetAll(query);
  }

  async GetTicketByID(id: string): Promise<TicketDTO.Ticket> {
    const ticket = await this.ticketRepository.GetByID(id);
    if (!ticket) {
      throw new Error.NotFoundError(Message.ticketNotFound);
    }
    return ticket;
  }

  async UpdateTicket(id: string, data: TicketDTO.UpdateTicket): Promise<TicketDTO.Ticket> {
    const existing = await this.ticketRepository.GetByID(id);
    if (!existing) {
      throw new Error.NotFoundError(Message.ticketNotFound);
    }

    const updated = await this.ticketRepository.Update(id, data);
    if (!updated) {
      throw new Error.NotFoundError(Message.ticketNotFound);
    }
    return updated;
  }

  async RemoveTicket(id: string): Promise<boolean> {
    const existing = await this.ticketRepository.GetByID(id);
    if (!existing) {
      throw new Error.NotFoundError(Message.ticketNotFound);
    }
    return this.ticketRepository.Remove(id);
  }
}

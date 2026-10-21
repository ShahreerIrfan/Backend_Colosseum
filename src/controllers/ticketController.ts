import type { Request, Response } from 'express';
import TicketService from '@services/ticketService.js';
import ResponseHandler from '@utils/responseHandler.js';
import { clearCachePattern } from '@utils/redisUtils.js';
import { HttpConstants, MessageConstants, EnvConstant } from '@constants/allConstant.js';

const HttpStatus = HttpConstants.statusCode;
const Message = MessageConstants.responseMessage.ticketController;

export default class TicketController {
  private ticketService: TicketService;

  constructor() {
    this.ticketService = new TicketService();
  }

  ValidateTicket = async (req: Request, res: Response): Promise<void> => {
    const { token, deviceId } = req.validatedBody;
    const result = await this.ticketService.ValidateTicket(token, deviceId);

    if (result.sessionToken) {
      res.cookie('colosseum_visitor_session', result.sessionToken, {
        httpOnly: true,
        secure: EnvConstant.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });
    }

    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: result,
      message: Message.ticketValidated,
    });
  };

  GetAllTickets = async (req: Request, res: Response): Promise<void> => {
    const query = req.validatedQuery || {};
    const result = await this.ticketService.GetAllTickets(query);
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: result.tickets,
      message: Message.ticketsRetrieved,
    });
  };

  GetTicketByID = async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedParams.id;
    const ticket = await this.ticketService.GetTicketByID(id);
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: ticket,
      message: Message.ticketRetrieved,
    });
  };

  CreateTicket = async (req: Request, res: Response): Promise<void> => {
    const data = req.validatedBody;
    const created = await this.ticketService.CreateTicket(data);

    await clearCachePattern('tickets:*');
    ResponseHandler.send(res, HttpStatus.CREATED.code, {
      data: created,
      message: Message.ticketCreated,
    });
  };

  UpdateTicket = async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedParams.id;
    const data = req.validatedBody;
    const updated = await this.ticketService.UpdateTicket(id, data);

    await clearCachePattern('tickets:*');
    ResponseHandler.send(res, HttpStatus.OK.code, {
      data: updated,
      message: Message.ticketUpdated,
    });
  };

  RemoveTicket = async (req: Request, res: Response): Promise<void> => {
    const id = req.validatedParams.id;
    await this.ticketService.RemoveTicket(id);

    await clearCachePattern('tickets:*');
    ResponseHandler.send(res, HttpStatus.OK.code, {
      message: Message.ticketRemoved,
    });
  };
}

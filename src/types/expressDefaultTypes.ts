import 'express';
import * as AuthDTO from '@dtos/authDTO.js';
import * as TicketDTO from '@dtos/ticketDTO.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthDTO.AuthPayload;
    ticketSession?: TicketDTO.TicketSession;
    validatedBody?: any;
    validatedParams?: any;
    validatedQuery?: any;
  }
}

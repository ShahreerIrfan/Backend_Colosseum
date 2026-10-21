import express, { Router } from 'express';
import TicketController from '@controllers/ticketController.js';
import { Validator } from '@middlewares/requestValidator.js';
import authenticateToken from '@middlewares/authenticateToken.js';
import { authorizeRole } from '@middlewares/authorizeRoles.js';
import * as TicketDTO from '@dtos/ticketDTO.js';
import * as CommonItemDTO from '@dtos/commonItemDTO.js';

const router: Router = express.Router();
const ticketController = new TicketController();

// Public voucher validation endpoint (for mobile tourists)
router.post(
  '/validate',
  Validator.body(TicketDTO.ValidateTicketSchema),
  ticketController.ValidateTicket
);

// Staff-protected ticket management (Super Admin, Admin)
router
  .route('/')
  .all(
    authenticateToken,
    authorizeRole.hasRole('SUPER_ADMIN', 'ADMIN')
  )
  .get(Validator.query(TicketDTO.QueryTicketSchema), ticketController.GetAllTickets)
  .post(Validator.body(TicketDTO.CreateTicketSchema), ticketController.CreateTicket);

router
  .route('/:id')
  .all(
    Validator.params(CommonItemDTO.IdSchema),
    authenticateToken,
    authorizeRole.hasRole('SUPER_ADMIN', 'ADMIN')
  )
  .get(ticketController.GetTicketByID)
  .patch(Validator.body(TicketDTO.UpdateTicketSchema), ticketController.UpdateTicket)
  .delete(ticketController.RemoveTicket);

export default router;

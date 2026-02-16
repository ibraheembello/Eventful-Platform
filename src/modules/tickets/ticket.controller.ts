import { Request, Response, NextFunction } from 'express';
import { TicketService } from './ticket.service';
import { ApiResponse } from '../../utils/apiResponse';
import { param } from '../../utils/param';

export class TicketController {
  static async getUserTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await TicketService.getUserTickets(req.user!.userId, page, limit);
      ApiResponse.paginated(res, (result as any).tickets, (result as any).total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  static async getTicketById(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await TicketService.getTicketById(param(req, 'id'), req.user!.userId);
      ApiResponse.success(res, ticket);
    } catch (error) {
      next(error);
    }
  }

  static async verifyTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const { qrToken } = req.body;
      const result = await TicketService.verifyTicket(qrToken, req.user!.userId);
      ApiResponse.success(res, result, 'Ticket verified successfully');
    } catch (error) {
      next(error);
    }
  }

  static async cancelTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await TicketService.cancelTicket(param(req, 'id'), req.user!.userId);
      ApiResponse.success(res, result, 'Ticket cancelled successfully');
    } catch (error) {
      next(error);
    }
  }
}

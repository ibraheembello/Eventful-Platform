import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { ApiResponse } from '../../utils/apiResponse';
import { param } from '../../utils/param';

export class AdminController {
  static async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getStats();
      ApiResponse.success(res, stats);
    } catch (error) {
      next(error);
    }
  }

  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string | undefined;
      const role = req.query.role as string | undefined;

      const result = await AdminService.getUsers(page, limit, search, role);
      ApiResponse.paginated(res, result.users, result.total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  static async changeUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AdminService.changeUserRole(param(req, 'id'), req.body.role);
      ApiResponse.success(res, user, `Role changed to ${req.body.role}`);
    } catch (error) {
      next(error);
    }
  }

  static async toggleSuspend(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AdminService.toggleSuspend(param(req, 'id'), req.body.suspended);
      ApiResponse.success(res, user, user.suspended ? 'User suspended' : 'User unsuspended');
    } catch (error) {
      next(error);
    }
  }

  static async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string | undefined;

      const result = await AdminService.getEvents(page, limit, search);
      ApiResponse.paginated(res, result.events, result.total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  static async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.deleteEvent(param(req, 'id'));
      ApiResponse.success(res, result, 'Event deleted by admin');
    } catch (error) {
      next(error);
    }
  }

  static async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await AdminService.getPayments(page, limit);
      ApiResponse.paginated(res, result.payments, result.total, page, limit);
    } catch (error) {
      next(error);
    }
  }
}

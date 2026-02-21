import { Request, Response, NextFunction } from 'express';
import { InAppNotificationService } from './in-app-notification.service';
import { ApiResponse } from '../../utils/apiResponse';
import { param } from '../../utils/param';

export class InAppNotificationController {
  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await InAppNotificationService.getForUser(req.user!.userId, page, limit);
      ApiResponse.paginated(res, (result as any).notifications, (result as any).total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  static async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await InAppNotificationService.getUnreadCount(req.user!.userId);
      ApiResponse.success(res, { count });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const notif = await InAppNotificationService.markAsRead(param(req, 'id'), req.user!.userId);
      ApiResponse.success(res, notif, 'Marked as read');
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await InAppNotificationService.markAllAsRead(req.user!.userId);
      ApiResponse.success(res, { count }, `${count} notification(s) marked as read`);
    } catch (error) {
      next(error);
    }
  }
}

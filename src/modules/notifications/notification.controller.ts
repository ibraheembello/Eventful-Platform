import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { ApiResponse } from '../../utils/apiResponse';
import { param } from '../../utils/param';

export class NotificationController {
  static async createReminder(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId, reminderValue, reminderUnit } = req.body;
      const notification = await NotificationService.createReminder(
        req.user!.userId,
        eventId,
        reminderValue,
        reminderUnit
      );
      ApiResponse.created(res, notification, 'Reminder set successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getUserReminders(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await NotificationService.getUserReminders(req.user!.userId, page, limit);
      ApiResponse.paginated(
        res,
        (result as any).notifications,
        (result as any).total,
        page,
        limit
      );
    } catch (error) {
      next(error);
    }
  }

  static async updateReminder(req: Request, res: Response, next: NextFunction) {
    try {
      const { reminderValue, reminderUnit } = req.body;
      const notification = await NotificationService.updateReminder(
        param(req, 'id'),
        req.user!.userId,
        reminderValue,
        reminderUnit
      );
      ApiResponse.success(res, notification, 'Reminder updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteReminder(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.deleteReminder(param(req, 'id'), req.user!.userId);
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}

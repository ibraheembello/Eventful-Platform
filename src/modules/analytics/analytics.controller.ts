import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';
import { ApiResponse } from '../../utils/apiResponse';
import { param } from '../../utils/param';

export class AnalyticsController {
  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AnalyticsService.getCreatorOverview(req.user!.userId);
      ApiResponse.success(res, result, 'Analytics overview retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getEventAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AnalyticsService.getEventAnalytics(param(req, 'id'), req.user!.userId);
      ApiResponse.success(res, result, 'Event analytics retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getEventsAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AnalyticsService.getCreatorEventsAnalytics(req.user!.userId);
      ApiResponse.success(res, result, 'Events analytics retrieved');
    } catch (error) {
      next(error);
    }
  }
}

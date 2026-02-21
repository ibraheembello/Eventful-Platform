import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { ApiResponse } from '../../utils/apiResponse';

export class DashboardController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await DashboardService.getUserDashboard(req.user!.userId, req.user!.role);
      ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}

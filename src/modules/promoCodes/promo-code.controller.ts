import { Request, Response, NextFunction } from 'express';
import { PromoCodeService } from './promo-code.service';
import { ApiResponse } from '../../utils/apiResponse';
import { param } from '../../utils/param';

export class PromoCodeController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const promoCode = await PromoCodeService.create(req.user!.userId, req.body);
      ApiResponse.created(res, promoCode, 'Promo code created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await PromoCodeService.getCreatorPromoCodes(req.user!.userId, page, limit);
      ApiResponse.paginated(res, result.promoCodes, result.total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const promoCode = await PromoCodeService.getById(param(req, 'id'), req.user!.userId);
      ApiResponse.success(res, promoCode);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const promoCode = await PromoCodeService.update(param(req, 'id'), req.user!.userId, req.body);
      ApiResponse.success(res, promoCode, 'Promo code updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PromoCodeService.delete(param(req, 'id'), req.user!.userId);
      ApiResponse.success(res, result, 'Promo code deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async validateCode(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PromoCodeService.validateCode(req.body.code, req.body.eventId);
      ApiResponse.success(res, result, 'Promo code is valid');
    } catch (error) {
      next(error);
    }
  }
}

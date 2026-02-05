import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { ApiResponse } from '../../utils/apiResponse';
import { param } from '../../utils/param';

export class PaymentController {
  static async initializePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PaymentService.initializePayment(req.user!.userId, req.body.eventId);
      ApiResponse.success(res, result, 'Payment initialized');
    } catch (error) {
      next(error);
    }
  }

  static async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const reference = param(req, 'reference');
      const result = await PaymentService.verifyPayment(reference);
      ApiResponse.success(res, result, 'Payment verified successfully');
    } catch (error) {
      next(error);
    }
  }

  static async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['x-paystack-signature'] as string;
      const result = await PaymentService.handleWebhook(req.body, signature);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getCreatorPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await PaymentService.getCreatorPayments(req.user!.userId, page, limit);

      // Return full result including payments array and analytics
      ApiResponse.success(res, result, 'Creator payments retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentByReference(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await PaymentService.getPaymentByReference(param(req, 'reference'));
      ApiResponse.success(res, payment);
    } catch (error) {
      next(error);
    }
  }
}

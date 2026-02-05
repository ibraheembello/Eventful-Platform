import { Request, Response, NextFunction } from 'express';
import { EventService } from './event.service';
import { ApiResponse } from '../../utils/apiResponse';
import { param } from '../../utils/param';

export class EventController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await EventService.create(req.user!.userId, req.body);
      ApiResponse.created(res, event, 'Event created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;

      const result = await EventService.getAll(page, limit, search, category);
      ApiResponse.paginated(res, (result as any).events, (result as any).total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await EventService.getById(param(req, 'id'));
      ApiResponse.success(res, event);
    } catch (error) {
      next(error);
    }
  }

  static async getCreatorEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await EventService.getCreatorEvents(req.user!.userId, page, limit);
      ApiResponse.paginated(res, (result as any).events, (result as any).total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  static async getEventAttendees(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await EventService.getEventAttendees(
        param(req, 'id'),
        req.user!.userId,
        page,
        limit
      );
      ApiResponse.paginated(
        res,
        (result as any).attendees,
        (result as any).total,
        page,
        limit,
        'Attendees retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  static async getEventeeEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await EventService.getEventeeEvents(req.user!.userId, page, limit);
      ApiResponse.paginated(res, (result as any).events, (result as any).total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await EventService.update(param(req, 'id'), req.user!.userId, req.body);
      ApiResponse.success(res, event, 'Event updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EventService.delete(param(req, 'id'), req.user!.userId);
      ApiResponse.success(res, result, 'Event deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getShareLinks(req: Request, res: Response, next: NextFunction) {
    try {
      const links = await EventService.getShareLinks(param(req, 'id'));
      ApiResponse.success(res, links, 'Share links generated');
    } catch (error) {
      next(error);
    }
  }
}

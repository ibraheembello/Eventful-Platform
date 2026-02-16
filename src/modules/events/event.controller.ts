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
      const dateFrom = req.query.dateFrom as string | undefined;
      const dateTo = req.query.dateTo as string | undefined;
      const priceMin = req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined;
      const priceMax = req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined;

      const result = await EventService.getAll(page, limit, search, category, dateFrom, dateTo, priceMin, priceMax);
      ApiResponse.paginated(res, (result as any).events, (result as any).total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await EventService.getCategories();
      ApiResponse.success(res, categories);
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
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as string | undefined;

      const result = await EventService.getEventAttendees(
        param(req, 'id'),
        req.user!.userId,
        page,
        limit,
        search,
        status,
        sortBy,
        sortOrder,
      );

      res.json({
        success: true,
        data: (result as any).attendees,
        stats: (result as any).stats,
        pagination: {
          page,
          limit,
          total: (result as any).total,
          totalPages: Math.ceil((result as any).total / limit),
        },
        message: 'Attendees retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async manualCheckIn(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EventService.manualCheckIn(
        req.body.ticketId,
        param(req, 'id'),
        req.user!.userId,
      );
      ApiResponse.success(res, result, 'Attendee checked in successfully');
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
      const result = await EventService.update(param(req, 'id'), req.user!.userId, req.body);
      const { notifiedCount, ...event } = result;
      const message = notifiedCount > 0
        ? `Event updated! ${notifiedCount} ticket holder(s) will be notified.`
        : 'Event updated successfully';
      ApiResponse.success(res, { ...event, notifiedCount }, message);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EventService.delete(param(req, 'id'), req.user!.userId);
      const message = result.notifiedCount > 0
        ? `Event deleted. ${result.notifiedCount} ticket holder(s) will be notified.`
        : 'Event deleted successfully';
      ApiResponse.success(res, result, message);
    } catch (error) {
      next(error);
    }
  }

  static async toggleBookmark(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EventService.toggleBookmark(req.user!.userId, param(req, 'id'));
      ApiResponse.success(res, result, result.bookmarked ? 'Event bookmarked' : 'Bookmark removed');
    } catch (error) {
      next(error);
    }
  }

  static async getBookmarkedEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await EventService.getBookmarkedEvents(req.user!.userId, page, limit);
      ApiResponse.paginated(res, (result as any).events, (result as any).total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  static async getBookmarkIds(req: Request, res: Response, next: NextFunction) {
    try {
      const ids = await EventService.getBookmarkIds(req.user!.userId);
      ApiResponse.success(res, ids);
    } catch (error) {
      next(error);
    }
  }

  static async joinWaitlist(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EventService.joinWaitlist(req.user!.userId, param(req, 'id'));
      ApiResponse.success(res, result, 'Added to waitlist');
    } catch (error) {
      next(error);
    }
  }

  static async leaveWaitlist(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EventService.leaveWaitlist(req.user!.userId, param(req, 'id'));
      ApiResponse.success(res, result, 'Removed from waitlist');
    } catch (error) {
      next(error);
    }
  }

  static async getWaitlistStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EventService.getWaitlistStatus(req.user!.userId, param(req, 'id'));
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getUserWaitlists(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await EventService.getUserWaitlists(req.user!.userId, page, limit);
      ApiResponse.paginated(res, (result as any).entries, (result as any).total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  static async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const comment = await EventService.createComment(req.user!.userId, param(req, 'id'), req.body);
      ApiResponse.created(res, comment, 'Review submitted');
    } catch (error) {
      next(error);
    }
  }

  static async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await EventService.getComments(param(req, 'id'), page, limit);
      res.json({
        success: true,
        data: (result as any).comments,
        averageRating: (result as any).averageRating,
        pagination: {
          page,
          limit,
          total: (result as any).total,
          totalPages: Math.ceil((result as any).total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EventService.deleteComment(param(req, 'commentId'), param(req, 'id'), req.user!.userId);
      ApiResponse.success(res, result, 'Review deleted');
    } catch (error) {
      next(error);
    }
  }

  static async addEventImage(req: Request, res: Response, next: NextFunction) {
    try {
      const image = await EventService.addEventImage(
        param(req, 'id'),
        req.user!.userId,
        req.body.url,
        req.body.caption,
      );
      ApiResponse.created(res, image, 'Image added');
    } catch (error) {
      next(error);
    }
  }

  static async removeEventImage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EventService.removeEventImage(
        param(req, 'imageId'),
        param(req, 'id'),
        req.user!.userId,
      );
      ApiResponse.success(res, result, 'Image removed');
    } catch (error) {
      next(error);
    }
  }

  static async getEventImages(req: Request, res: Response, next: NextFunction) {
    try {
      const images = await EventService.getEventImages(param(req, 'id'));
      ApiResponse.success(res, images);
    } catch (error) {
      next(error);
    }
  }

  static async reorderImages(req: Request, res: Response, next: NextFunction) {
    try {
      const images = await EventService.reorderImages(
        param(req, 'id'),
        req.user!.userId,
        req.body.imageIds,
      );
      ApiResponse.success(res, images, 'Images reordered');
    } catch (error) {
      next(error);
    }
  }

  static async updateImage(req: Request, res: Response, next: NextFunction) {
    try {
      const image = await EventService.updateImage(
        param(req, 'imageId'),
        param(req, 'id'),
        req.user!.userId,
        req.body.caption,
      );
      ApiResponse.success(res, image, 'Image updated');
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

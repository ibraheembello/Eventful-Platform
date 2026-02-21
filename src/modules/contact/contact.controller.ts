import { Request, Response, NextFunction } from 'express';
import { ContactService } from './contact.service';

export const submitContact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, message } = req.body;
    await ContactService.submit(name, email, message);
    res.status(201).json({
      success: true,
      message: 'Message sent successfully. We will get back to you soon.',
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentMessages = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const messages = await ContactService.getRecent(5);
    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

export const markMessageRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await ContactService.markAsRead(id);
    res.json({ success: true, message: 'Message marked as read' });
  } catch (error) {
    next(error);
  }
};

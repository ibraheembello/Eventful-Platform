import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { upload } from '../../middleware/upload';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload an image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                       example: /uploads/abc123.jpg
 *       400:
 *         description: No file uploaded or invalid file type
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('image')(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: 'File size must be under 5MB' });
        }
        return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file provided' });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ success: true, data: { imageUrl } });
    });
  }
);

export default router;

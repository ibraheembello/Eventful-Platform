import crypto from 'crypto';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';

export interface QRPayload {
  ticketId: string;
  eventId: string;
  userId: string;
  code: string;
}

export class QRCodeService {
  static async generateQRCode(ticketId: string, eventId: string, userId: string) {
    // Use Node.js built-in crypto.randomUUID() instead of the uuid package
    const code = crypto.randomUUID();

    const payload: QRPayload = { ticketId, eventId, userId, code };

    const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'secret', {
      expiresIn: 31536000, // 365 days in seconds
    } as jwt.SignOptions);

    const qrCodeDataUrl = await QRCode.toDataURL(token, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return { qrCode: code, qrCodeData: qrCodeDataUrl, token };
  }

  static verifyQRToken(token: string): QRPayload {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'secret') as QRPayload;
    return decoded;
  }
}

import transporter, { emailFrom } from '../config/email';

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

function baseTemplate(title: string, body: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">
  <div style="text-align:center;padding:24px 0">
    <span style="font-size:24px;font-weight:700;background:linear-gradient(to right,#059669,#0d9488);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Eventful</span>
  </div>
  <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <h1 style="margin:0 0 16px;font-size:22px;color:#111827">${title}</h1>
    ${body}
  </div>
  <div style="text-align:center;padding:24px 0;color:#9ca3af;font-size:12px">
    <p style="margin:0">&copy; ${new Date().getFullYear()} Eventful Platform. All rights reserved.</p>
    <p style="margin:8px 0 0"><a href="${clientUrl}" style="color:#059669;text-decoration:none">eventful-platform.com</a></p>
  </div>
</div>
</body></html>`;
}

function button(text: string, href: string) {
  return `<div style="text-align:center;margin:24px 0">
    <a href="${href}" style="display:inline-block;padding:12px 32px;background:linear-gradient(to right,#059669,#0d9488);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px">${text}</a>
  </div>`;
}

export class EmailService {
  static async send(to: string, subject: string, html: string) {
    if (!transporter) return;
    try {
      await transporter.sendMail({ from: emailFrom, to, subject, html });
    } catch (err) {
      console.error(`[EMAIL] Failed to send to ${to}:`, (err as Error).message);
    }
  }

  static async sendWelcome(email: string, firstName: string) {
    const html = baseTemplate('Welcome to Eventful!', `
      <p style="color:#6b7280;line-height:1.6;margin:0 0 16px">Hi ${firstName},</p>
      <p style="color:#6b7280;line-height:1.6;margin:0 0 16px">
        Thanks for joining Eventful! You're all set to discover amazing events, purchase tickets, and much more.
      </p>
      ${button('Explore Events', `${clientUrl}/events`)}
      <p style="color:#6b7280;line-height:1.6;margin:0">Happy exploring!</p>
    `);
    await this.send(email, 'Welcome to Eventful!', html);
  }

  static async sendTicketConfirmation(
    email: string,
    firstName: string,
    event: { title: string; date: Date | string; location: string; id: string },
    amount: number,
  ) {
    const dateStr = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
    const html = baseTemplate('Ticket Confirmed!', `
      <p style="color:#6b7280;line-height:1.6;margin:0 0 16px">Hi ${firstName},</p>
      <p style="color:#6b7280;line-height:1.6;margin:0 0 16px">
        Great news! Your ticket for <strong style="color:#111827">${event.title}</strong> has been confirmed.
      </p>
      <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:16px 0">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px">Event</td>
            <td style="padding:8px 0;color:#111827;font-weight:600;text-align:right">${event.title}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px">Date</td>
            <td style="padding:8px 0;color:#111827;text-align:right;font-size:13px">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px">Location</td>
            <td style="padding:8px 0;color:#111827;text-align:right;font-size:13px">${event.location}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px">Amount</td>
            <td style="padding:8px 0;color:#059669;font-weight:600;text-align:right">${amount > 0 ? `NGN ${amount.toLocaleString()}` : 'Free'}</td>
          </tr>
        </table>
      </div>
      ${button('View My Tickets', `${clientUrl}/tickets`)}
      <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;line-height:1.5">
        Your QR code ticket is available in your account. Present it at the venue for entry.
      </p>
    `);
    await this.send(email, `Ticket Confirmed: ${event.title}`, html);
  }

  static async sendEventReminder(
    email: string,
    firstName: string,
    event: { title: string; date: Date | string; location: string; id: string },
    message: string,
  ) {
    const dateStr = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
    const html = baseTemplate('Event Reminder', `
      <p style="color:#6b7280;line-height:1.6;margin:0 0 16px">Hi ${firstName},</p>
      <p style="color:#6b7280;line-height:1.6;margin:0 0 16px">${message}</p>
      <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:16px 0">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px">Event</td>
            <td style="padding:8px 0;color:#111827;font-weight:600;text-align:right">${event.title}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px">Date</td>
            <td style="padding:8px 0;color:#111827;text-align:right;font-size:13px">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px">Location</td>
            <td style="padding:8px 0;color:#111827;text-align:right;font-size:13px">${event.location}</td>
          </tr>
        </table>
      </div>
      ${button('View Event', `${clientUrl}/events/${event.id}`)}
      <p style="color:#9ca3af;font-size:12px;margin:16px 0 0">Don't forget to bring your QR ticket!</p>
    `);
    await this.send(email, `Reminder: ${event.title}`, html);
  }

  static async sendEventUpdate(
    email: string,
    firstName: string,
    event: { title: string; date: Date | string; location: string; id: string },
    changes: string[],
  ) {
    const dateStr = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
    const changeList = changes.map((c) => `<li style="padding:4px 0;color:#6b7280">${c}</li>`).join('');
    const html = baseTemplate('Event Updated', `
      <p style="color:#6b7280;line-height:1.6;margin:0 0 16px">Hi ${firstName},</p>
      <p style="color:#6b7280;line-height:1.6;margin:0 0 16px">
        The organizer has updated <strong style="color:#111827">${event.title}</strong>. Here's what changed:
      </p>
      <ul style="margin:0 0 16px;padding-left:20px">${changeList}</ul>
      <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:16px 0">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px">Event</td>
            <td style="padding:8px 0;color:#111827;font-weight:600;text-align:right">${event.title}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px">Date</td>
            <td style="padding:8px 0;color:#111827;text-align:right;font-size:13px">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px">Location</td>
            <td style="padding:8px 0;color:#111827;text-align:right;font-size:13px">${event.location}</td>
          </tr>
        </table>
      </div>
      ${button('View Updated Event', `${clientUrl}/events/${event.id}`)}
      <p style="color:#9ca3af;font-size:12px;margin:16px 0 0">Your ticket is still valid. No action needed.</p>
    `);
    await this.send(email, `Event Updated: ${event.title}`, html);
  }

  static async sendEventCancellation(
    email: string,
    firstName: string,
    event: { title: string; date: Date | string; location: string },
  ) {
    const dateStr = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
    const html = baseTemplate('Event Cancelled', `
      <p style="color:#6b7280;line-height:1.6;margin:0 0 16px">Hi ${firstName},</p>
      <p style="color:#6b7280;line-height:1.6;margin:0 0 16px">
        We're sorry to inform you that <strong style="color:#111827">${event.title}</strong> has been cancelled by the organizer.
      </p>
      <div style="background:#fef2f2;border-radius:12px;padding:20px;margin:16px 0;border-left:4px solid #ef4444">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px">Event</td>
            <td style="padding:8px 0;color:#111827;font-weight:600;text-align:right">${event.title}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px">Date</td>
            <td style="padding:8px 0;color:#111827;text-align:right;font-size:13px">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px">Location</td>
            <td style="padding:8px 0;color:#111827;text-align:right;font-size:13px">${event.location}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px">Status</td>
            <td style="padding:8px 0;color:#ef4444;font-weight:600;text-align:right">Cancelled</td>
          </tr>
        </table>
      </div>
      <p style="color:#6b7280;line-height:1.6;margin:0 0 16px">
        If you paid for a ticket, please contact the event organizer for a refund.
      </p>
      ${button('Browse Other Events', `${clientUrl}/events`)}
      <p style="color:#9ca3af;font-size:12px;margin:16px 0 0">We apologize for the inconvenience.</p>
    `);
    await this.send(email, `Event Cancelled: ${event.title}`, html);
  }

  static async sendPasswordReset(email: string, firstName: string, resetUrl: string) {
    const html = baseTemplate('Reset Your Password', `
      <p style="color:#6b7280;line-height:1.6;margin:0 0 16px">Hi ${firstName},</p>
      <p style="color:#6b7280;line-height:1.6;margin:0 0 16px">
        We received a request to reset your password for your Eventful account. Click the button below to set a new password:
      </p>
      ${button('Reset Password', resetUrl)}
      <p style="color:#6b7280;line-height:1.6;margin:0 0 16px">
        This link will expire in <strong style="color:#111827">1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.
      </p>
      <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;line-height:1.5">
        If the button doesn't work, copy and paste this URL into your browser:<br/>
        <a href="${resetUrl}" style="color:#059669;word-break:break-all">${resetUrl}</a>
      </p>
    `);
    await this.send(email, 'Reset Your Password — Eventful', html);
  }

  static async sendTicketTransferSent(
    email: string,
    firstName: string,
    event: { title: string; date: Date | string; location: string },
    recipientEmail: string,
  ) {
    const html = baseTemplate('Ticket Transferred', `
      <p style="color:#6b7280;line-height:1.6;margin:0 0 16px">Hi ${firstName},</p>
      <p style="color:#6b7280;line-height:1.6;margin:0 0 16px">
        Your ticket for <strong style="color:#111827">${event.title}</strong> has been transferred to <strong style="color:#111827">${recipientEmail}</strong>.
      </p>
      <p style="color:#9ca3af;font-size:12px;margin:16px 0 0">This ticket is no longer in your account.</p>
    `);
    await this.send(email, `Ticket Transferred: ${event.title}`, html);
  }

  static async sendTicketTransferReceived(
    email: string,
    firstName: string,
    event: { title: string; date: Date | string; location: string },
    senderEmail: string,
  ) {
    const html = baseTemplate('You Received a Ticket!', `
      <p style="color:#6b7280;line-height:1.6;margin:0 0 16px">Hi ${firstName},</p>
      <p style="color:#6b7280;line-height:1.6;margin:0 0 16px">
        <strong style="color:#111827">${senderEmail}</strong> has transferred a ticket to you for <strong style="color:#111827">${event.title}</strong>.
      </p>
      ${button('View My Tickets', `${clientUrl}/tickets`)}
      <p style="color:#9ca3af;font-size:12px;margin:16px 0 0">Your QR code ticket is available in your account.</p>
    `);
    await this.send(email, `Ticket Received: ${event.title}`, html);
  }

  static async sendContactNotification(name: string, email: string, message: string) {
    const adminEmail = process.env.ADMIN_EMAIL || 'belloibrahimolawale@gmail.com';
    const html = baseTemplate('New Contact Message', `
      <p style="color:#6b7280;line-height:1.6;margin:0 0 16px">You have a new message from the Eventful contact form.</p>
      <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:16px 0">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px">Name</td>
            <td style="padding:8px 0;color:#111827;font-weight:600;text-align:right">${name}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#9ca3af;font-size:13px">Email</td>
            <td style="padding:8px 0;color:#111827;text-align:right;font-size:13px">
              <a href="mailto:${email}" style="color:#059669;text-decoration:none">${email}</a>
            </td>
          </tr>
        </table>
      </div>
      <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:16px 0">
        <p style="color:#9ca3af;font-size:13px;margin:0 0 8px">Message</p>
        <p style="color:#111827;line-height:1.6;margin:0;white-space:pre-wrap">${message}</p>
      </div>
      <p style="color:#9ca3af;font-size:12px;margin:16px 0 0">Reply directly to the sender at <a href="mailto:${email}" style="color:#059669">${email}</a></p>
    `);
    await this.send(adminEmail, `Eventful Contact: ${name}`, html);
  }

  static async sendWaitlistNotification(
    email: string,
    firstName: string,
    event: { title: string; id: string },
  ) {
    const html = baseTemplate('A Spot Opened Up!', `
      <p style="color:#6b7280;line-height:1.6;margin:0 0 16px">Hi ${firstName},</p>
      <p style="color:#6b7280;line-height:1.6;margin:0 0 16px">
        Good news! A spot has opened up for <strong style="color:#111827">${event.title}</strong>.
        Grab your ticket before it's gone!
      </p>
      ${button('Get Your Ticket', `${clientUrl}/events/${event.id}`)}
      <p style="color:#9ca3af;font-size:12px;margin:16px 0 0">Tickets are first come, first served.</p>
    `);
    await this.send(email, `Spot Available: ${event.title}`, html);
  }
}

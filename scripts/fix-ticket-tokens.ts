import prisma from '../src/config/database';
import { QRCodeService } from '../src/modules/qrcode/qrcode.service';

async function fixTicketTokens() {
  console.log('Starting to fix ticket QR tokens...');

  try {
    // Get all tickets
    const tickets = await prisma.ticket.findMany({
      select: {
        id: true,
        eventId: true,
        userId: true,
        qrCodeData: true,
      },
    });

    console.log(`Found ${tickets.length} tickets to update`);

    let fixed = 0;
    let skipped = 0;

    for (const ticket of tickets) {
      // Check if qrCodeData is a JWT (starts with 'eyJ') or a UUID
      if (ticket.qrCodeData && !ticket.qrCodeData.startsWith('eyJ')) {
        // Regenerate the QR code with JWT token
        const qrData = await QRCodeService.generateQRCode(
          ticket.id,
          ticket.eventId,
          ticket.userId
        );

        await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            qrCode: qrData.qrCode,
            qrCodeData: qrData.token, // Store the JWT token
          },
        });

        fixed++;
        console.log(`Fixed ticket ${ticket.id}`);
      } else {
        skipped++;
      }
    }

    console.log(`\n✅ Complete!`);
    console.log(`Fixed: ${fixed} tickets`);
    console.log(`Skipped: ${skipped} tickets (already have valid JWT tokens)`);
  } catch (error) {
    console.error('Error fixing tickets:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixTicketTokens();

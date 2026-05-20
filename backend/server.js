require('dotenv').config();

const http = require('http');
const { Op } = require('sequelize');
const { sequelize, Booking, Notification, RecurringBookingItem, RecurringBookingSeries, Stadium } = require('./models');
const socket = require('./socket');
const { createApp } = require('./app');
const { processRecurringPaymentReminders } = require('./utils/recurringBookingService');

const app = createApp();
const server = http.createServer(app);

socket.init(server);

const PORT = process.env.PORT || 5000;

sequelize
  .authenticate()
  .then(() => {
    console.log('Database connected successfully');

    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);

      const socketObj = require('./socket');

      setInterval(async () => {
        try {
          const expiredBookings = await Booking.findAll({
            where: {
              status: 'pending',
              payment_status: 'unpaid',
              hold_until: { [Op.lt]: new Date() },
            },
          });

          for (const booking of expiredBookings) {
            await booking.update({ status: 'expired' });

            try {
              const io = socketObj.getIO();
              io.emit('slotReleased', {
                field_id: booking.field_id,
                date: booking.booking_date,
                start_time: booking.start_time,
              });
            } catch (e) {
              console.log('Socket emit error on auto-release:', e.message);
            }
          }

          if (expiredBookings.length > 0) {
            console.log(`Auto-released ${expiredBookings.length} expired reservations.`);
          }

          try {
            const reminderCount = await processRecurringPaymentReminders(
              { Notification, RecurringBookingItem, RecurringBookingSeries, Stadium },
              new Date()
            );

            if (reminderCount > 0) {
              console.log(`Sent ${reminderCount} recurring payment reminders.`);
            }
          } catch (reminderError) {
            console.error('Recurring reminder error:', reminderError);
          }
        } catch (err) {
          console.error('Auto-release error:', err);
        }
      }, 60000);
    });
  })
  .catch((err) => console.error('Database connection error:', err));

module.exports = { app, server };

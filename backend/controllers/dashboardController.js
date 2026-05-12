const { sequelize } = require('../models');

const getOwnerStats = async (req, res) => {
    const { ownerId } = req.params;

    try {
        // 1. Đếm đơn đặt hôm nay
        const [todayBookingsRes] = await sequelize.query(`
            SELECT COUNT(*) as total 
            FROM bookings b
            JOIN fields f ON b.field_id = f.id
            JOIN stadiums s ON f.stadium_id = s.id
            WHERE s.owner_id = ? AND DATE(b.booking_date) = CURDATE()
        `, { replacements: [ownerId] });

        // 2. Tính doanh thu tháng này (chỉ tính đơn confirmed)
        const [monthlyRevenueRes] = await sequelize.query(`
            SELECT COALESCE(SUM(b.total_price), 0) as total 
            FROM bookings b
            JOIN fields f ON b.field_id = f.id
            JOIN stadiums s ON f.stadium_id = s.id
            WHERE s.owner_id = ? 
            AND b.status = 'confirmed'
            AND MONTH(b.booking_date) = MONTH(CURDATE())
            AND YEAR(b.booking_date) = YEAR(CURDATE())
        `, { replacements: [ownerId] });

        res.json({
            todayBookings: parseInt(todayBookingsRes[0]?.total || 0),
            monthlyRevenue: parseInt(monthlyRevenueRes[0]?.total || 0)
        });
    } catch (error) {
        console.error("Lỗi Dashboard:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getOwnerStats };
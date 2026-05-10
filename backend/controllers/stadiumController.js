const { sequelize } = require('../models');

// 1. Lấy toàn bộ danh sách
const getAllStadiums = async (req, res) => {
    try {
        // 1. Lấy Khu (Stadiums) + Địa chỉ
        const [stadiums] = await sequelize.query(`
            SELECT s.*, l.address, l.district 
            FROM stadiums s 
            LEFT JOIN locations l ON s.location_id = l.id
        `);

        // 2. Lấy Sân nhỏ (Fields)
        const [allFields] = await sequelize.query(`
            SELECT * FROM fields
        `);

        // 3. Lấy hình ảnh của sân
        const [allImages] = await sequelize.query(`
            SELECT * FROM fieldimages
        `);

        // 4. Gộp Sân nhỏ và Hình ảnh vào đúng Khu
        const result = stadiums.map(stadium => {
            return {
                ...stadium,
                fields: allFields
                    .filter(f => f.stadium_id === stadium.id)
                    .map(f => ({
                        ...f,
                        images: allImages.filter(img => img.field_id === f.id)
                    }))
            };
        });

        // Trả về kết quả
        res.status(200).json(result);
    } catch (error) {
        console.error("Lỗi: ", error);
        res.status(500).json({ message: "Lỗi Server", error: error.message });
    }
};

// 2. Lấy chi tiết 1 sân
const getStadiumById = async (req, res) => {
    try {
        const [rows] = await sequelize.query('SELECT * FROM stadiums WHERE id = ?', {
            replacements: [req.params.id],
            type: sequelize.QueryTypes.SELECT
        });
        
        if (!rows || rows.length === 0) return res.status(404).json({ message: "Không tìm thấy" });
        res.json(rows[0] || rows); // Sequelize query SELECT trả về mảng trực tiếp
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Thêm Stadium mới
const createStadium = async (req, res) => {
    const { name, description, address, owner_id } = req.body;
    const t = await sequelize.transaction(); // Dùng transaction để an toàn dữ liệu

    try {
        // BƯỚC 1: Tạo một dòng địa chỉ mới hoàn toàn trong bảng locations
        const [locationResult] = await sequelize.query(
            'INSERT INTO locations (address, createdAt, updatedAt) VALUES (?, NOW(), NOW())',
            { replacements: [address || 'Chưa có địa chỉ'], transaction: t }
        );
        
        // Lấy ID của địa chỉ vừa tạo (Tùy thuộc vào DB, thường là locationResult)
        const newLocationId = locationResult; 

        // BƯỚC 2: Tạo Stadium mới trỏ vào cái ID địa chỉ vừa tạo ở trên, status mặc định 'active'
        await sequelize.query(
            'INSERT INTO stadiums (name, description, location_id, owner_id, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
            {
                replacements: [name, description, newLocationId, owner_id || 2, 'active'],
                transaction: t
            }
        );

        await t.commit();
        res.status(201).json({ message: "Thêm khu và địa chỉ riêng biệt thành công!" });
    } catch (err) {
        await t.rollback();
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
// 4. Cập nhật (Bản đã sửa lỗi)
const updateStadium = async (req, res) => {
    const { name, description, status, address, location_id } = req.body;
    const { id } = req.params;

    try {
        // 1. Cập nhật Stadium
        await sequelize.query(
            'UPDATE stadiums SET name = ?, description = ?, status = ?, updatedAt = NOW() WHERE id = ?',
            { replacements: [name, description, status || 'active', id] }
        );

        // 2. Cập nhật Địa chỉ (Sửa điều kiện check address)
        if (location_id && address !== undefined) {
            await sequelize.query(
                'UPDATE locations SET address = ? WHERE id = ?',
                { replacements: [address, location_id] }
            );
            console.log("Đã cập nhật địa chỉ mới:", address);
        }

        res.json({ message: "Cập nhật thành công!" });
    } catch (err) {
        console.error("Lỗi:", err.message);
        res.status(500).json({ error: err.message });
    }
};
// 5. Xóa
const deleteStadium = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Tìm thông tin Stadium để lấy location_id
        const [stadium] = await sequelize.query('SELECT location_id FROM stadiums WHERE id = ?', {
            replacements: [id],
            type: sequelize.QueryTypes.SELECT
        });

        if (stadium) {
            // 2. Xóa Stadium (Sẽ tự động xóa Fields, Bookings... nhờ CASCADE)
            await sequelize.query('DELETE FROM stadiums WHERE id = ?', { replacements: [id] });

            // 3. Xóa luôn Location để sạch Database
            if (stadium.location_id) {
                await sequelize.query('DELETE FROM locations WHERE id = ?', { replacements: [stadium.location_id] });
            }
        }

        res.json({ message: "Xóa thành công khu và các dữ liệu liên quan" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
// Lấy
// Lấy danh sách Khu kèm theo các sân bên trong
const getStadiumsWithFields = async (req, res) => {
    try {
        // Lấy tất cả khu
        const [stadiums] = await sequelize.query(`
            SELECT s.*, l.address 
            FROM stadiums s 
            LEFT JOIN locations l ON s.location_id = l.id
        `);

        // Lấy tất cả sân
        const [fields] = await sequelize.query(`SELECT * FROM fields`);

        // Lấy hình ảnh của sân
        const [images] = await sequelize.query(`SELECT * FROM fieldimages`);

        // Nhóm sân vào khu
        const result = stadiums.map(stadium => {
            return {
                ...stadium,
                fields: fields
                    .filter(f => f.stadium_id === stadium.id)
                    .map(f => ({
                        ...f,
                        images: images.filter(img => img.field_id === f.id)
                    }))
            };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lấy tất cả Stadium của một Owner (Kể cả pending hay rejected)
const getOwnerStadiums = async (req, res) => {
    try {
        const { ownerId } = req.params;
        const [stadiums] = await sequelize.query(`
            SELECT s.*, l.address, l.district 
            FROM stadiums s 
            LEFT JOIN locations l ON s.location_id = l.id
            WHERE s.owner_id = ?
        `, { replacements: [ownerId] });

        res.json(stadiums);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllStadiums,
    getStadiumById,
    createStadium,
    updateStadium,
    deleteStadium,
    getStadiumsWithFields,
    getOwnerStadiums
};
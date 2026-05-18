const db = require('../models');
const { logAdminActivity } = require('../utils/adminActivityLogger');

const getRequestMeta = (req) => ({
  ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
  userAgent: req.headers['user-agent'] || null,
});

const toPlain = (instance) => (instance ? instance.get({ plain: true }) : null);
const isAdminUser = (req) => Number(req.user?.role) === 3;

const getAllStadiums = async (req, res) => {
  try {
    const stadiums = await db.Stadium.findAll({
      include: [
        { model: db.Location, as: 'location' },
        { model: db.Hashtag, as: 'hashtags', through: { attributes: [] } },
        {
          model: db.Field,
          as: 'fields',
          include: [{ model: db.FieldImage, as: 'images' }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(stadiums);
  } catch (error) {
    console.error('Loi:', error);
    res.status(500).json({ message: 'Loi server', error: error.message });
  }
};

const getStadiumById = async (req, res) => {
  try {
    const stadium = await db.Stadium.findByPk(req.params.id, {
      include: [
        { model: db.Location, as: 'location' },
        { model: db.Hashtag, as: 'hashtags', through: { attributes: [] } },
        {
          model: db.Field,
          as: 'fields',
          include: [{ model: db.FieldImage, as: 'images' }],
        },
      ],
    });

    if (!stadium) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(stadium);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createStadium = async (req, res) => {
  const { name, description, address, district, city, owner_id } = req.body;
  const transaction = await db.sequelize.transaction();

  try {
    const resolvedOwnerId = isAdminUser(req) && owner_id ? owner_id : req.user?.id;

    if (!resolvedOwnerId) {
      await transaction.rollback();
      return res.status(401).json({ error: 'Không xác định được chủ sân' });
    }

    const location = await db.Location.create(
      {
        address: address || 'Chua co dia chi',
        district: district || null,
        city: city || 'TP. Hồ Chí Minh',
      },
      { transaction }
    );

    const newStadium = await db.Stadium.create(
      {
        name,
        description,
        location_id: location.id,
        owner_id: resolvedOwnerId,
        status: 'active',
      },
      { transaction }
    );

    await transaction.commit();

    await logAdminActivity({
      adminId: req.user?.id || newStadium.owner_id,
      action: 'OWNER_CREATE_STADIUM',
      targetType: 'stadium',
      targetId: newStadium.id,
      afterData: {
        name: newStadium.name,
        description: newStadium.description,
        status: newStadium.status,
        owner_id: newStadium.owner_id,
        location_id: newStadium.location_id,
        address: location.address,
        district: location.district,
        city: location.city,
      },
      ...getRequestMeta(req),
    });

    res.status(201).json({ message: 'Them khu va dia chi thanh cong!', data: newStadium });
  } catch (err) {
    if (!transaction.finished) await transaction.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const updateStadium = async (req, res) => {
  const { name, description, status, address, district, city, location_id } = req.body;
  const { id } = req.params;

  try {
    const stadium = await db.Stadium.findByPk(id, {
      include: [{ model: db.Location, as: 'location' }],
    });

    if (!stadium) return res.status(404).json({ message: 'Không tìm thấy' });
    if (!isAdminUser(req) && Number(stadium.owner_id) !== Number(req.user?.id)) {
      return res.status(403).json({ error: 'Bạn không có quyền cập nhật khu sân này' });
    }

    const before = toPlain(stadium);

    await stadium.update({
      name,
      description,
      status: status || 'active',
    });

    if (location_id || stadium.location_id) {
      const locationPayload = {};
      if (address !== undefined) locationPayload.address = address;
      if (district !== undefined) locationPayload.district = district || null;
      if (city !== undefined) locationPayload.city = city || null;

      if (Object.keys(locationPayload).length > 0) {
        await db.Location.update(locationPayload, {
          where: { id: location_id || stadium.location_id },
        });
      }
    }

    const updatedStadium = await db.Stadium.findByPk(id, {
      include: [{ model: db.Location, as: 'location' }],
    });

    await logAdminActivity({
      adminId: req.user?.id || updatedStadium.owner_id,
      action: 'OWNER_UPDATE_STADIUM',
      targetType: 'stadium',
      targetId: updatedStadium.id,
      beforeData: {
        name: before.name,
        description: before.description,
        status: before.status,
        address: before.location?.address || null,
        district: before.location?.district || null,
        city: before.location?.city || null,
      },
      afterData: {
        name: updatedStadium.name,
        description: updatedStadium.description,
        status: updatedStadium.status,
        address: updatedStadium.location?.address || null,
        district: updatedStadium.location?.district || null,
        city: updatedStadium.location?.city || null,
      },
      ...getRequestMeta(req),
    });

    res.json({ message: 'Cập nhật thành công!' });
  } catch (err) {
    console.error('Loi:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const deleteStadium = async (req, res) => {
  try {
    const { id } = req.params;
    const stadium = await db.Stadium.findByPk(id);

    if (!stadium) {
      return res.status(404).json({ error: 'Không tìm thấy khu sân' });
    }

    if (!isAdminUser(req) && Number(stadium.owner_id) !== Number(req.user?.id)) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa khu sân này' });
    }

    const before = toPlain(stadium);
    const locId = stadium.location_id;
    await stadium.destroy();

    if (locId) {
      await db.Location.destroy({ where: { id: locId } });
    }

    await logAdminActivity({
      adminId: req.user?.id || before.owner_id,
      action: 'OWNER_DELETE_STADIUM',
      targetType: 'stadium',
      targetId: before.id,
      beforeData: before,
      ...getRequestMeta(req),
    });

    res.json({ message: 'Xóa thành công khu và các dữ liệu liên quan' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const getOwnerStadiums = async (req, res) => {
  try {
    const { ownerId } = req.params;

    if (!isAdminUser(req) && Number(ownerId) !== Number(req.user?.id)) {
      return res.status(403).json({ error: 'Bạn không có quyền xem danh sách khu sân này' });
    }

    const stadiums = await db.Stadium.findAll({
      where: { owner_id: ownerId },
      include: [
        { model: db.Location, as: 'location' },
        { model: db.Hashtag, as: 'hashtags', through: { attributes: [] } },
      ],
      order: [['createdAt', 'DESC']],
    });

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
  getStadiumsWithFields: getAllStadiums,
  getOwnerStadiums,
};

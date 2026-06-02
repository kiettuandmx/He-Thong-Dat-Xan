const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
const db = require('../models'); 
// Thay vì dùng { User }, ta lấy trực tiếp từ đối tượng db
// Lưu ý: Kiểm tra xem trong DB/Model bạn đặt tên là 'User' hay 'user'
const UserModel = db.User || db.user; 

exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, role_id } = req.body;
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const newUser = await UserModel.create({ // Dùng UserModel đã check ở trên
            name, email, phone, role_id: role_id || 1,
            password: hashedPassword
        });
        res.status(201).json({ success: true, message: "Đăng ký thành công!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Dùng UserModel để findOne
        const user = await UserModel.findOne({ where: { email } });
        
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role_id }, // Thường Sequelize mặc định là .id, nếu bạn đặt là .user_id thì giữ nguyên
            process.env.JWT_SECRET || 'secret_key', // Thêm dự phòng nếu chưa có file .env
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            token,
            user: { 
                id: user.id,        // PHẢI CÓ để gọi API lịch sử (không còn undefined)
                name: user.name, 
                email: user.email,  // PHẢI CÓ để hiện ở Profile
                phone: user.phone,  // PHẢI CÓ để hiện ở Profile
                role: user.role_id 
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await UserModel.findOne({ where: { email } });
        
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng với email này" });
        }

        // Tạo token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash token và lưu vào db
        const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 phút

        await user.update({
            resetPasswordToken,
            resetPasswordExpire
        });

        // Tạo URL reset
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

        // Gửi email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'test@gmail.com',
                pass: process.env.EMAIL_PASS || 'password123'
            }
        });

        const message = {
            from: `${process.env.EMAIL_FROM_NAME || 'He Thong Dat San'} <${process.env.EMAIL_FROM || 'test@gmail.com'}>`,
            to: user.email,
            subject: 'Yêu cầu đặt lại mật khẩu',
            html: `
                <h3>Bạn đã yêu cầu đặt lại mật khẩu</h3>
                <p>Vui lòng click vào link bên dưới để đặt lại mật khẩu của bạn. Link này có hiệu lực trong vòng 15 phút:</p>
                <a href="${resetUrl}" target="_blank">${resetUrl}</a>
                <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
            `
        };

        // NẾU CHƯA CẤU HÌNH EMAIL TRONG .ENV THÌ IN RA TERMINAL ĐỂ TEST
        if (!process.env.EMAIL_USER) {
            console.log("=========================================");
            console.log("⚠️ BẠN CHƯA CẤU HÌNH GMAIL SMTP TRONG .ENV");
            console.log("🔗 ĐÂY LÀ LINK ĐỂ TEST (Copy dán vào trình duyệt):");
            console.log(resetUrl);
            console.log("=========================================");
            return res.status(200).json({ success: true, message: "Vì chưa cấu hình Email, vui lòng xem link đặt lại mật khẩu trong Terminal của Backend!" });
        }

        try {
            await transporter.sendMail(message);
            res.status(200).json({ success: true, message: "Email đã được gửi" });
        } catch (err) {
            console.error("Lỗi gửi mail:", err.message);
            user.resetPasswordToken = null;
            user.resetPasswordExpire = null;
            await user.save();
            return res.status(500).json({ success: false, message: "Lỗi SMTP: Sai tài khoản/mật khẩu Email" });
        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        // Lấy token từ URL và mã hóa lại để so sánh với DB
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await UserModel.findOne({
            where: {
                resetPasswordToken,
                resetPasswordExpire: { [Op.gt]: Date.now() } // Còn hạn
            }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
        }

        // Set password mới
        const salt = bcrypt.genSaltSync(10);
        user.password = bcrypt.hashSync(req.body.password, salt);
        
        // Reset tokens
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;

        await user.save();

        res.status(200).json({ success: true, message: "Mật khẩu đã được cập nhật thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

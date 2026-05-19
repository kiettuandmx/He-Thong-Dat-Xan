const db = require('../models');
const {
  applyWalletTransaction,
  getOrCreateWallet,
} = require('../utils/walletService');
const {
  WALLET_TRANSACTION_TYPES,
} = require('../utils/walletTypes');

const normalizeAmount = (value) => Number(value || 0);

const validatePositiveAmount = (amount) =>
  Number.isFinite(amount) && amount > 0;

exports.getWalletSummary = async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(db, req.user.id);
    const transactions = await db.WalletTransaction.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    return res.status(200).json({
      success: true,
      data: {
        balance: normalizeAmount(wallet.balance),
        transactions,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWalletTransactions = async (req, res) => {
  try {
    const transactions = await db.WalletTransaction.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.topUp = async (req, res) => {
  try {
    const amount = normalizeAmount(req.body.amount);
    const provider = String(req.body.provider || '').trim();

    if (!validatePositiveAmount(amount)) {
      return res.status(400).json({ success: false, message: 'So tien nap khong hop le.' });
    }

    if (!['vnpay', 'momo'].includes(provider.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Phuong thuc nap tien khong hop le.' });
    }

    const result = await db.sequelize.transaction((transaction) =>
      applyWalletTransaction(
        db,
        {
          userId: req.user.id,
          amount,
          type: WALLET_TRANSACTION_TYPES.TOP_UP,
          description: `Nap tien vao vi qua ${provider}`,
          referenceType: 'top_up',
          metadata: { provider: provider.toLowerCase() },
        },
        transaction
      )
    );

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.withdraw = async (req, res) => {
  const amount = normalizeAmount(req.body.amount);
  const bankName = String(req.body.bank_name || '').trim();
  const bankAccount = String(req.body.bank_account || '').trim();
  const accountHolder = String(req.body.account_holder || '').trim();

  if (!validatePositiveAmount(amount)) {
    return res.status(400).json({ success: false, message: 'So tien rut khong hop le.' });
  }

  if (!bankName || !bankAccount || !accountHolder) {
    return res.status(400).json({
      success: false,
      message: 'Vui long nhap day du thong tin ngan hang.',
    });
  }

  try {
    const result = await db.sequelize.transaction((transaction) =>
      applyWalletTransaction(
        db,
        {
          userId: req.user.id,
          amount,
          type: WALLET_TRANSACTION_TYPES.WITHDRAW,
          description: 'Rut tien ve tai khoan ngan hang',
          referenceType: 'withdrawal',
          metadata: {
            bank_name: bankName,
            bank_account: bankAccount,
            account_holder: accountHolder,
          },
        },
        transaction
      )
    );

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error.message === 'INSUFFICIENT_WALLET_BALANCE') {
      return res.status(400).json({
        success: false,
        message: 'So du vi khong du de rut tien.',
      });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
};

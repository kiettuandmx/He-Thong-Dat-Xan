import React, { useEffect, useState } from 'react';
import AccountPageHeader from '../components/AccountPageHeader';
import { getWalletSummary, topUpWallet, withdrawWallet } from '../services/walletService';
import {
  formatSignedCurrency,
  getWalletTransactionDirection,
} from '../utils/transactionPresentation';

const formatAmount = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const resolveTransactionLabel = (type) => {
  switch (type) {
    case 'TOP_UP':
      return 'Nạp tiền vào ví';
    case 'WITHDRAW':
      return 'Rút tiền khỏi ví';
    case 'BOOKING_PAYMENT':
      return 'Thanh toán đơn đặt sân';
    case 'BOOKING_REFUND':
      return 'Hoàn tiền do hủy sân';
    default:
      return 'Giao dịch ví';
  }
};

const WalletPage = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topUpForm, setTopUpForm] = useState({ amount: '', provider: 'vnpay' });
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    bank_name: '',
    bank_account: '',
    account_holder: '',
  });

  const loadWallet = async () => {
    try {
      setLoading(true);
      const response = await getWalletSummary();
      setBalance(Number(response.data?.data?.balance || 0));
      setTransactions(response.data?.data?.transactions || []);
    } catch (error) {
      window.alert(error.response?.data?.message || 'Không thể tải dữ liệu ví tiền.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const handleTopUp = async (event) => {
    event.preventDefault();

    try {
      await topUpWallet({
        amount: Number(topUpForm.amount || 0),
        provider: topUpForm.provider,
      });
      window.alert('Nạp tiền vào ví thành công.');
      setTopUpForm({ amount: '', provider: 'vnpay' });
      await loadWallet();
    } catch (error) {
      window.alert(error.response?.data?.message || 'Không thể nạp tiền vào ví.');
    }
  };

  const handleWithdraw = async (event) => {
    event.preventDefault();

    try {
      await withdrawWallet({
        ...withdrawForm,
        amount: Number(withdrawForm.amount || 0),
      });
      window.alert('Rút tiền thành công.');
      setWithdrawForm({
        amount: '',
        bank_name: '',
        bank_account: '',
        account_holder: '',
      });
      await loadWallet();
    } catch (error) {
      window.alert(error.response?.data?.message || 'Không thể rút tiền khỏi ví.');
    }
  };

  return (
    <div className="account-page wallet-page">
      <AccountPageHeader
        title="Ví tiền của tôi"
        description="Dùng ví để thanh toán đặt sân, nhận hoàn tiền khi hủy sân, nạp tiền và rút tiền ngay trong hệ thống."
      />

      <section className="wallet-balance-card">
        <p className="eyebrow mb-2">Ví tiền</p>
        <div className="wallet-balance-card__row">
          <div>
            <h2 className="h4 fw-bold mb-1">Số dư hiện tại</h2>
            <p className="text-muted mb-0">Sẵn sàng dùng để thanh toán đơn đặt sân nếu đủ số dư.</p>
          </div>
          <strong className="wallet-balance-card__amount">{formatAmount(balance)}</strong>
        </div>
      </section>

      <div className="row g-4">
        <div className="col-lg-6">
          <form className="wallet-action-card h-100" onSubmit={handleTopUp}>
            <div className="wallet-card-heading">
              <h2 className="h5 fw-bold mb-1">Nạp tiền</h2>
              <p className="text-muted mb-0">Chọn số tiền và phương thức nạp vào ví.</p>
            </div>

            <div className="row g-3">
              <div className="col-12">
                <label className="filter-label" htmlFor="walletTopUpAmount">
                  Số tiền muốn nạp
                </label>
                <input
                  id="walletTopUpAmount"
                  className="filter-input"
                  min="1000"
                  type="number"
                  value={topUpForm.amount}
                  onChange={(event) =>
                    setTopUpForm((prev) => ({ ...prev, amount: event.target.value }))
                  }
                />
              </div>

              <div className="col-12">
                <p className="filter-label mb-2">Phương thức nạp</p>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className={`payment-option flex-fill ${topUpForm.provider === 'vnpay' ? 'is-active' : ''}`}
                    onClick={() => setTopUpForm((prev) => ({ ...prev, provider: 'vnpay' }))}
                  >
                    VNPay
                  </button>
                  <button
                    type="button"
                    className={`payment-option flex-fill ${topUpForm.provider === 'momo' ? 'is-active' : ''}`}
                    onClick={() => setTopUpForm((prev) => ({ ...prev, provider: 'momo' }))}
                  >
                    MoMo
                  </button>
                </div>
              </div>

              <div className="col-12 text-end">
                <button type="submit" className="primary-button px-4 py-3">
                  Nạp tiền
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="col-lg-6">
          <form className="wallet-action-card h-100" onSubmit={handleWithdraw}>
            <div className="wallet-card-heading">
              <h2 className="h5 fw-bold mb-1">Rút tiền</h2>
              <p className="text-muted mb-0">Nhập thông tin ngân hàng cho từng lần rút tiền.</p>
            </div>

            <div className="row g-3">
              <div className="col-12">
                <label className="filter-label" htmlFor="walletWithdrawAmount">
                  Số tiền muốn rút
                </label>
                <input
                  id="walletWithdrawAmount"
                  className="filter-input"
                  min="1000"
                  type="number"
                  value={withdrawForm.amount}
                  onChange={(event) =>
                    setWithdrawForm((prev) => ({ ...prev, amount: event.target.value }))
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="filter-label" htmlFor="walletBankName">
                  Tên ngân hàng
                </label>
                <input
                  id="walletBankName"
                  className="filter-input"
                  type="text"
                  value={withdrawForm.bank_name}
                  onChange={(event) =>
                    setWithdrawForm((prev) => ({ ...prev, bank_name: event.target.value }))
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="filter-label" htmlFor="walletBankAccount">
                  Số tài khoản
                </label>
                <input
                  id="walletBankAccount"
                  className="filter-input"
                  type="text"
                  value={withdrawForm.bank_account}
                  onChange={(event) =>
                    setWithdrawForm((prev) => ({ ...prev, bank_account: event.target.value }))
                  }
                />
              </div>

              <div className="col-12">
                <label className="filter-label" htmlFor="walletAccountHolder">
                  Tên chủ tài khoản
                </label>
                <input
                  id="walletAccountHolder"
                  className="filter-input"
                  type="text"
                  value={withdrawForm.account_holder}
                  onChange={(event) =>
                    setWithdrawForm((prev) => ({ ...prev, account_holder: event.target.value }))
                  }
                />
              </div>

              <div className="col-12 text-end">
                <button type="submit" className="secondary-button px-4 py-3">
                  Rút tiền
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <section className="wallet-history-card">
        <div className="wallet-card-heading">
          <h2 className="h5 fw-bold mb-1">Lịch sử giao dịch</h2>
          <p className="text-muted mb-0">Theo dõi các khoản nạp, rút, thanh toán và hoàn tiền gần đây.</p>
        </div>

        {loading ? (
          <div className="account-empty-state">Đang tải dữ liệu ví tiền...</div>
        ) : transactions.length === 0 ? (
          <div className="account-empty-state">Chưa có giao dịch ví nào được ghi nhận.</div>
        ) : (
          <div className="wallet-transaction-list">
            {transactions.map((transaction) => {
              const direction = getWalletTransactionDirection(transaction.type);

              return (
                <article key={transaction.id} className="wallet-transaction-item">
                  <div>
                    <strong>{resolveTransactionLabel(transaction.type)}</strong>
                    <p className="text-muted mb-0">{transaction.description || 'Giao dịch ví'}</p>
                  </div>
                  <div className="text-end">
                    <strong className={`wallet-amount is-${direction}`}>
                      {formatSignedCurrency(transaction.amount, direction)}
                    </strong>
                    <p className="text-muted mb-0">
                      {transaction.createdAt
                        ? new Date(transaction.createdAt).toLocaleString('vi-VN')
                        : 'Vừa xong'}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default WalletPage;

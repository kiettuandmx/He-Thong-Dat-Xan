import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AccountPageHeader from '../components/AccountPageHeader';
import {
  buildCurrentMonthDefaultFilter,
  getOwnerPaymentHistory,
  getUserPaymentHistory,
} from '../services/paymentHistoryService';
import { formatOwnerCurrency } from '../utils/ownerMetricsHelpers';

const formatDate = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleString('vi-VN');
};

const transactionLabelMap = {
  refund: { label: 'Hoàn tiền', className: 'is-refund' },
  payment: { label: 'Thanh toán', className: 'is-payment' },
};

const transactionStatusLabelMap = {
  paid: 'Đã thanh toán',
  partially_paid: 'Thanh toán một phần',
  unpaid: 'Chưa thanh toán',
  refunded: 'Đã hoàn tiền',
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  rejected: 'Đã từ chối',
  cancelled: 'Đã hủy',
  completed: 'Hoàn tất',
  failed: 'Thất bại',
};

const getTransactionStatusLabel = (status) =>
  transactionStatusLabelMap[status] || status || '--';

const PaymentHistory = () => {
  const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const role = Number(savedUser?.user?.role_id || savedUser?.user?.role);
  const isOwner = role === 2;
  const [filters, setFilters] = useState(buildCurrentMonthDefaultFilter);
  const [mode, setMode] = useState('month');
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalPayment: 0,
    totalRefund: 0,
    netRevenue: 0,
  });
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async (nextFilters, append = false) => {
    setLoading(true);
    setError('');

    try {
      const service = isOwner ? getOwnerPaymentHistory : getUserPaymentHistory;
      const data = await service(nextFilters);

      setTransactions((current) =>
        append ? [...current, ...(data.transactions || [])] : data.transactions || []
      );
      setSummary((current) => ({
        totalPayment: data.summary?.totalPayment ?? current.totalPayment ?? 0,
        totalRefund: data.summary?.totalRefund ?? current.totalRefund ?? 0,
        netRevenue: data.summary?.netRevenue ?? 0,
      }));
      setHasMore(Boolean(data.hasMore));
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          'Không thể tải lịch sử thanh toán. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  }, [isOwner]);

  useEffect(() => {
    fetchHistory(filters);
  }, [fetchHistory]); // initial filters are stable on mount

  const handleMonthChange = (event) => {
    const value = event.target.value;
    setFilters((current) => ({
      ...current,
      month: value,
      page: 1,
      startDate: undefined,
      endDate: undefined,
    }));
  };

  const handleYearChange = (event) => {
    const value = event.target.value;
    setFilters((current) => ({
      ...current,
      year: value,
      page: 1,
      startDate: undefined,
      endDate: undefined,
    }));
  };

  const handleDateChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
      page: 1,
    }));
  };

  const handleApplyFilters = () => {
    const nextFilters =
      mode === 'custom'
        ? {
            startDate: filters.startDate || '',
            endDate: filters.endDate || '',
            page: 1,
            limit: filters.limit,
          }
        : {
            month: filters.month,
            year: filters.year,
            page: 1,
            limit: filters.limit,
          };

    setFilters(nextFilters);
    fetchHistory(nextFilters);
  };

  const handleLoadMore = () => {
    const nextFilters = { ...filters, page: Number(filters.page || 1) + 1 };
    setFilters(nextFilters);
    fetchHistory(nextFilters, true);
  };

  const ownerInsights = useMemo(
    () => [
      {
        label: 'Tổng thanh toán',
        value: formatOwnerCurrency(summary.totalPayment),
        note: 'Bao gồm toàn bộ khoản khách đã thanh toán trong giai đoạn chọn.',
      },
      {
        label: 'Tổng hoàn tiền',
        value: formatOwnerCurrency(summary.totalRefund),
        note: 'Các khoản hoàn lại cần theo dõi để đánh giá chất lượng dịch vụ.',
      },
      {
        label: 'Doanh thu thực nhận',
        value: formatOwnerCurrency(summary.netRevenue),
        note: 'Chỉ số quan trọng nhất để nhìn hiệu quả vận hành hiện tại.',
      },
    ],
    [summary]
  );

  const renderFilterFields = () => (
    <div className={isOwner ? 'owner-finance-filter-grid' : 'row g-3 align-items-end'}>
      {mode === 'month' ? (
        <>
          <div className={isOwner ? '' : 'col-md-4'}>
            <label className="filter-label">Tháng</label>
            <select className="filter-select" value={filters.month || ''} onChange={handleMonthChange}>
              {Array.from({ length: 12 }, (_, index) => {
                const monthValue = String(index + 1).padStart(2, '0');
                return (
                  <option key={monthValue} value={monthValue}>
                    Tháng {index + 1}
                  </option>
                );
              })}
            </select>
          </div>
          <div className={isOwner ? '' : 'col-md-4'}>
            <label className="filter-label">Năm</label>
            <input
              className="filter-input"
              type="number"
              min="2000"
              value={filters.year || ''}
              onChange={handleYearChange}
            />
          </div>
        </>
      ) : (
        <>
          <div className={isOwner ? '' : 'col-md-4'}>
            <label className="filter-label">Từ ngày</label>
            <input
              className="filter-input"
              type="date"
              name="startDate"
              value={filters.startDate || ''}
              onChange={handleDateChange}
            />
          </div>
          <div className={isOwner ? '' : 'col-md-4'}>
            <label className="filter-label">Đến ngày</label>
            <input
              className="filter-input"
              type="date"
              name="endDate"
              value={filters.endDate || ''}
              onChange={handleDateChange}
            />
          </div>
        </>
      )}

      <div className={isOwner ? '' : 'col-md-4'}>
        <button type="button" className="primary-button w-100 py-3" onClick={handleApplyFilters}>
          Áp dụng bộ lọc
        </button>
      </div>
    </div>
  );

  const renderUserView = () => (
    <div className="account-page">
      <AccountPageHeader
        title="Lịch sử thanh toán"
        description="Xem lại toàn bộ giao dịch thanh toán và hoàn tiền liên quan đến những lần đặt sân của bạn."
      />

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="account-card h-100">
            <div className="text-muted small mb-2">Tổng thanh toán</div>
            <div className="fw-bold fs-5 text-success">{formatOwnerCurrency(summary.totalPayment)}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="account-card h-100">
            <div className="text-muted small mb-2">Tổng hoàn tiền</div>
            <div className="fw-bold fs-5 text-danger">{formatOwnerCurrency(summary.totalRefund)}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="account-card h-100">
            <div className="text-muted small mb-2">Chênh lệch thanh toán</div>
            <div className="fw-bold fs-5" style={{ color: 'var(--color-text)' }}>
              {formatOwnerCurrency(
                Number(summary.totalPayment || 0) - Number(summary.totalRefund || 0)
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="account-card mb-4">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            className={mode === 'month' ? 'primary-button px-4 py-3' : 'secondary-button px-4 py-3'}
            onClick={() => setMode('month')}
          >
            Theo tháng
          </button>
          <button
            type="button"
            className={mode === 'custom' ? 'primary-button px-4 py-3' : 'secondary-button px-4 py-3'}
            onClick={() => setMode('custom')}
          >
            Theo khoảng ngày
          </button>
        </div>

        {renderFilterFields()}
      </div>

      {renderTable(false)}
    </div>
  );

  const renderTable = (ownerMode) => {
    if (error) {
      return <div className="account-empty-state">{error}</div>;
    }

    const emptyCopy = ownerMode
      ? 'Chưa có giao dịch nào trong giai đoạn bạn đã chọn.'
      : 'Chưa có giao dịch nào trong khoảng thời gian bạn đã chọn.';
    const loadingCopy = ownerMode
      ? 'Đang tải dữ liệu giao dịch của chủ sân...'
      : 'Đang tải dữ liệu giao dịch...';

    return (
      <div className={ownerMode ? 'owner-table-panel' : 'account-card'}>
        {loading && transactions.length === 0 ? (
          <div className={ownerMode ? 'owner-empty-state' : 'account-empty-state'}>{loadingCopy}</div>
        ) : transactions.length === 0 ? (
          <div className={ownerMode ? 'owner-empty-state' : 'account-empty-state'}>{emptyCopy}</div>
        ) : (
          <>
            <div className="table-responsive">
              <table className={`table align-middle mb-0 ${ownerMode ? 'owner-finance-table' : ''}`}>
                <thead>
                  <tr>
                    <th>Ngày giao dịch</th>
                    <th>Loại giao dịch</th>
                    <th>Cơ sở</th>
                    <th>Sân</th>
                    {ownerMode && <th>Khách hàng</th>}
                    <th>Trạng thái</th>
                    <th className="text-end">Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => {
                    const mappedType = transactionLabelMap[transaction.type] || transactionLabelMap.payment;

                    return (
                      <tr key={`${transaction.type}-${transaction.bookingId}-${index}`}>
                        <td>{formatDate(transaction.transactionDate)}</td>
                        <td>
                          <span className={`owner-finance-badge ${mappedType.className}`}>
                            {mappedType.label}
                          </span>
                        </td>
                        <td>{transaction.stadiumName || '--'}</td>
                        <td>{transaction.fieldName || '--'}</td>
                        {ownerMode && (
                          <td>
                            <div className="owner-finance-customer">
                              <strong>{transaction.userName || '--'}</strong>
                              <span className="owner-subtle">{transaction.userPhone || ''}</span>
                            </div>
                          </td>
                        )}
                        <td>{getTransactionStatusLabel(transaction.status)}</td>
                        <td
                          className={`text-end fw-semibold ${
                            transaction.type === 'refund' ? 'text-danger' : 'text-success'
                          }`}
                        >
                          {formatOwnerCurrency(transaction.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {hasMore && (
              <div className="text-center mt-3">
                <button
                  type="button"
                  className="secondary-button px-4 py-3"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Đang tải thêm...' : 'Xem thêm'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  if (!isOwner) {
    return renderUserView();
  }

  return (
    <div className="account-page owner-finance-grid">
      <section className="owner-hero-panel">
        <div className="owner-hero-layout">
          <div>
            <p className="eyebrow">Không gian làm việc tài chính</p>
            <h1>Lịch sử thanh toán chủ sân</h1>
            <p className="mb-0">
              Theo dõi dòng tiền, các khoản hoàn tiền và doanh thu thực nhận theo từng giai đoạn
              để điều hành khu sân chắc tay hơn.
            </p>
          </div>
          <div className="owner-hero-metrics">
            <div className="owner-hero-metric">
              <span>Tổng thanh toán</span>
              <strong>{formatOwnerCurrency(summary.totalPayment)}</strong>
            </div>
            <div className="owner-hero-metric">
              <span>Tổng hoàn tiền</span>
              <strong>{formatOwnerCurrency(summary.totalRefund)}</strong>
            </div>
            <div className="owner-hero-metric">
              <span>Doanh thu thực nhận</span>
              <strong>{formatOwnerCurrency(summary.netRevenue)}</strong>
            </div>
            <div className="owner-hero-metric">
              <span>Số giao dịch đang xem</span>
              <strong>{transactions.length}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="owner-finance-summary">
        {ownerInsights.map((item) => (
          <article key={item.label} className="owner-kpi-card">
            <div className="owner-kpi-card__meta">
              <p className="owner-kpi-card__label">{item.label}</p>
              <span className="owner-kpi-card__icon">
                <i className="bi bi-graph-up-arrow"></i>
              </span>
            </div>
            <p className="owner-kpi-value">{item.value}</p>
            <p className="owner-kpi-note">{item.note}</p>
          </article>
        ))}
      </section>

      <section className="owner-filter-panel">
        <div className="owner-panel-heading">
          <div>
            <h2>Bộ lọc dòng tiền</h2>
            <p className="owner-panel-description">
              Chuyển nhanh giữa góc nhìn theo tháng và theo khoảng ngày để so sánh doanh thu.
            </p>
          </div>
        </div>

        <div className="owner-finance-toolbar">
          <button
            type="button"
            className={mode === 'month' ? 'primary-button px-4 py-3' : 'secondary-button px-4 py-3'}
            onClick={() => setMode('month')}
          >
            Theo tháng
          </button>
          <button
            type="button"
            className={mode === 'custom' ? 'primary-button px-4 py-3' : 'secondary-button px-4 py-3'}
            onClick={() => setMode('custom')}
          >
            Theo khoảng ngày
          </button>
        </div>

        {renderFilterFields()}
      </section>

      <section className="owner-workspace-grid">
        <div className="owner-panel-heading">
          <div>
            <h2>Bảng giao dịch</h2>
            <p className="owner-panel-description">
              Danh sách chi tiết các khoản thanh toán và hoàn tiền để bạn đối chiếu với lịch đặt
              sân và chăm sóc khách hàng.
            </p>
          </div>
        </div>

        {renderTable(true)}
      </section>
    </div>
  );
};

export default PaymentHistory;

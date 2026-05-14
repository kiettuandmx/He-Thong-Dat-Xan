import React, { useEffect, useState } from 'react';
import {
  buildCurrentMonthDefaultFilter,
  getOwnerPaymentHistory,
  getUserPaymentHistory,
} from '../services/paymentHistoryService';

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('vi-VN') + ' VND';
}

function formatDate(value) {
  if (!value) {
    return '--';
  }

  return new Date(value).toLocaleString('vi-VN');
}

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

  const fetchHistory = async (nextFilters, append = false) => {
    setLoading(true);
    setError('');

    try {
      const service = isOwner ? getOwnerPaymentHistory : getUserPaymentHistory;
      const data = await service(nextFilters);

      setTransactions((current) =>
        append ? [...current, ...(data.transactions || [])] : data.transactions || [],
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
          'Khong the tai lich su thanh toan. Vui long thu lai.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(filters);
  }, []);

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

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            {isOwner ? 'Lich su thanh toan chu san' : 'Lich su thanh toan'}
          </h2>
          <p className="text-muted mb-0">
            {isOwner
              ? 'Theo doi giao dich thanh toan va hoan tien cua san.'
              : 'Xem lai cac giao dich thanh toan va hoan tien cua ban.'}
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className={`btn ${mode === 'month' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setMode('month')}
          >
            Theo thang
          </button>
          <button
            type="button"
            className={`btn ${mode === 'custom' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setMode('custom')}
          >
            Theo ngay
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small mb-2">Tong thanh toan</div>
              <div className="fw-bold fs-5 text-success">
                {formatCurrency(summary.totalPayment)}
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small mb-2">Tong hoan tien</div>
              <div className="fw-bold fs-5 text-danger">
                {formatCurrency(summary.totalRefund)}
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small mb-2">
                {isOwner ? 'Doanh thu thuc nhan' : 'Chenh lech thanh toan'}
              </div>
              <div className="fw-bold fs-5" style={{ color: '#1B4332' }}>
                {formatCurrency(
                  isOwner
                    ? summary.netRevenue
                    : Number(summary.totalPayment || 0) - Number(summary.totalRefund || 0),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            {mode === 'month' ? (
              <>
                <div className="col-md-4">
                  <label className="form-label">Thang</label>
                  <select
                    className="form-select"
                    value={filters.month || ''}
                    onChange={handleMonthChange}
                  >
                    {Array.from({ length: 12 }, (_, index) => {
                      const monthValue = String(index + 1).padStart(2, '0');

                      return (
                        <option key={monthValue} value={monthValue}>
                          Thang {index + 1}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Nam</label>
                  <input
                    className="form-control"
                    type="number"
                    min="2000"
                    value={filters.year || ''}
                    onChange={handleYearChange}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="col-md-4">
                  <label className="form-label">Tu ngay</label>
                  <input
                    className="form-control"
                    type="date"
                    name="startDate"
                    value={filters.startDate || ''}
                    onChange={handleDateChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Den ngay</label>
                  <input
                    className="form-control"
                    type="date"
                    name="endDate"
                    value={filters.endDate || ''}
                    onChange={handleDateChange}
                  />
                </div>
              </>
            )}
            <div className="col-md-4">
              <button type="button" className="btn btn-success w-100" onClick={handleApplyFilters}>
                Ap dung bo loc
              </button>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            {loading && transactions.length === 0 ? (
              <p className="mb-0">Dang tai du lieu...</p>
            ) : transactions.length === 0 ? (
              <p className="mb-0 text-muted">Chua co giao dich nao trong khoang da chon.</p>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Ngay giao dich</th>
                        <th>Loai</th>
                        <th>San</th>
                        <th>Khu vuc</th>
                        {isOwner && <th>Khach hang</th>}
                        <th>Trang thai</th>
                        <th className="text-end">So tien</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction, index) => (
                        <tr key={`${transaction.type}-${transaction.bookingId}-${index}`}>
                          <td>{formatDate(transaction.transactionDate)}</td>
                          <td>
                            <span
                              className={`badge ${
                                transaction.type === 'refund' ? 'bg-danger' : 'bg-success'
                              }`}
                            >
                              {transaction.type === 'refund' ? 'Hoan tien' : 'Thanh toan'}
                            </span>
                          </td>
                          <td>{transaction.stadiumName || '--'}</td>
                          <td>{transaction.fieldName || '--'}</td>
                          {isOwner && (
                            <td>
                              <div>{transaction.userName || '--'}</div>
                              <div className="small text-muted">{transaction.userPhone || ''}</div>
                            </td>
                          )}
                          <td>{transaction.status || '--'}</td>
                          <td
                            className={`text-end fw-semibold ${
                              transaction.type === 'refund' ? 'text-danger' : 'text-success'
                            }`}
                          >
                            {formatCurrency(transaction.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {hasMore && (
                  <div className="text-center mt-3">
                    <button
                      type="button"
                      className="btn btn-outline-success"
                      onClick={handleLoadMore}
                      disabled={loading}
                    >
                      {loading ? 'Dang tai...' : 'Xem them'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;

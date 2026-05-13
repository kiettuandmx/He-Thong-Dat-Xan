import React, { useEffect, useState } from "react";
import {
  buildCurrentMonthDefaultFilter,
  getOwnerPaymentHistory,
  getUserPaymentHistory,
} from "../services/paymentHistoryService";

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString("vi-VN") : "Khong xac dinh";
}

export default function PaymentHistory() {
  const stored = JSON.parse(localStorage.getItem("user") || "{}");
  const role = Number(stored?.user?.role_id || stored?.user?.role);
  const isOwner = role === 2;
  const [filters, setFilters] = useState(() => buildCurrentMonthDefaultFilter());
  const [payload, setPayload] = useState({
    transactions: [],
    total: 0,
    hasMore: false,
    currentPage: 1,
    limit: 10,
    summary: { totalPayment: 0, totalRefund: 0, netRevenue: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("month");

  async function loadHistory(nextFilters, append = false) {
    const request = isOwner ? getOwnerPaymentHistory : getUserPaymentHistory;

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await request(nextFilters);
      setPayload((current) => ({
        ...response,
        transactions: append
          ? [...current.transactions, ...response.transactions]
          : response.transactions,
      }));
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadHistory(filters);
  }, []);

  function resetToCurrentMonth() {
    const nextFilters = buildCurrentMonthDefaultFilter();
    setMode("month");
    setFilters(nextFilters);
    loadHistory(nextFilters);
  }

  function handleDateSubmit(event) {
    event.preventDefault();
    const nextFilters = {
      ...filters,
      page: 1,
      month: undefined,
      year: undefined,
    };
    setFilters(nextFilters);
    loadHistory(nextFilters);
  }

  function handleLoadMore() {
    const nextFilters = {
      ...filters,
      page: payload.currentPage + 1,
    };
    setFilters(nextFilters);
    loadHistory(nextFilters, true);
  }

  return (
    <div className="container mt-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            {isOwner ? "Lich su thanh toan cua san" : "Lich su thanh toan"}
          </h4>
          <div className="text-muted small">
            Bao gom ca giao dich thanh toan va hoan tien trong thang hien tai
          </div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-success" onClick={resetToCurrentMonth}>
            Thang nay
          </button>
          <button className="btn btn-outline-secondary" onClick={() => setMode("custom")}>
            Tuy chinh
          </button>
        </div>
      </div>

      {mode === "custom" && (
        <form className="card border-0 shadow-sm p-3 mb-4" onSubmit={handleDateSubmit}>
          <div className="row g-3">
            <div className="col-md-5">
              <label className="form-label">Tu ngay</label>
              <input
                type="date"
                className="form-control"
                value={filters.startDate || ""}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, startDate: event.target.value }))
                }
              />
            </div>
            <div className="col-md-5">
              <label className="form-label">Den ngay</label>
              <input
                type="date"
                className="form-control"
                value={filters.endDate || ""}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, endDate: event.target.value }))
                }
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-dark w-100" type="submit">
                Loc
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="row g-3 mb-4">
        <div className={isOwner ? "col-md-4" : "col-md-6"}>
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Tong thanh toan</div>
              <div className="fs-4 fw-bold text-success">
                {formatMoney(payload.summary?.totalPayment)}
              </div>
            </div>
          </div>
        </div>
        <div className={isOwner ? "col-md-4" : "col-md-6"}>
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Tong hoan tien</div>
              <div className="fs-4 fw-bold text-danger">
                {formatMoney(payload.summary?.totalRefund)}
              </div>
            </div>
          </div>
        </div>
        {isOwner && (
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-muted small">Doanh thu thuc</div>
                <div className="fs-4 fw-bold text-primary">
                  {formatMoney(payload.summary?.netRevenue)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">Dang tai du lieu...</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Ma don</th>
                  <th>San</th>
                  {isOwner && <th>Khach hang</th>}
                  <th>Loai</th>
                  <th>So tien</th>
                  <th>Phuong thuc</th>
                  <th>Ngay giao dich</th>
                </tr>
              </thead>
              <tbody>
                {payload.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={isOwner ? 7 : 6} className="text-center py-5 text-muted">
                      Chua co giao dich nao trong bo loc hien tai.
                    </td>
                  </tr>
                ) : (
                  payload.transactions.map((transaction, index) => (
                    <tr key={`${transaction.type}-${transaction.bookingId}-${index}`}>
                      <td className="ps-4 fw-semibold">#{transaction.bookingId}</td>
                      <td>
                        <div>{transaction.stadiumName || "Khong xac dinh"}</div>
                        <small className="text-muted">{transaction.fieldName || ""}</small>
                      </td>
                      {isOwner && (
                        <td>
                          <div>{transaction.userName || "Khong xac dinh"}</div>
                          <small className="text-muted">{transaction.userPhone || ""}</small>
                        </td>
                      )}
                      <td>
                        <span
                          className={`badge ${
                            transaction.type === "payment" ? "bg-success" : "bg-danger"
                          }`}
                        >
                          {transaction.type === "payment" ? "Thanh toan" : "Hoan tien"}
                        </span>
                      </td>
                      <td
                        className={
                          transaction.type === "payment"
                            ? "text-success fw-bold"
                            : "text-danger fw-bold"
                        }
                      >
                        {isOwner ? (transaction.type === "payment" ? "+" : "-") : ""}
                        {formatMoney(
                          transaction.type === "payment"
                            ? transaction.amount
                            : transaction.refundAmount,
                        )}
                      </td>
                      <td>{transaction.paymentMethod || "Khong xac dinh"}</td>
                      <td>{formatDateTime(transaction.transactionDate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && payload.hasMore && (
        <div className="text-center mt-4">
          <button
            className="btn btn-outline-dark"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Dang tai..." : "Tai them"}
          </button>
        </div>
      )}
    </div>
  );
}

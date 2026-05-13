function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

const VIETNAM_UTC_OFFSET_MINUTES = 7 * 60;
const VIETNAM_UTC_OFFSET_MILLISECONDS = VIETNAM_UTC_OFFSET_MINUTES * 60 * 1000;

function getVietnamDateParts(date) {
  const localTimestamp = date.getTime() + VIETNAM_UTC_OFFSET_MILLISECONDS;
  const localDate = new Date(localTimestamp);

  return {
    year: localDate.getUTCFullYear(),
    monthIndex: localDate.getUTCMonth(),
    day: localDate.getUTCDate(),
  };
}

function createBoundaryDate(year, monthIndex, day, isEndOfDay) {
  const nextDayUtcTimestamp =
    Date.UTC(year, monthIndex, day + (isEndOfDay ? 1 : 0), 0, 0, 0, 0) -
    VIETNAM_UTC_OFFSET_MILLISECONDS;

  return new Date(nextDayUtcTimestamp - (isEndOfDay ? 1 : 0));
}

function parseVietnamDateString(value, label) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcTimestamp = Date.UTC(year, month - 1, day);
  const validationDate = new Date(utcTimestamp);

  if (
    validationDate.getUTCFullYear() !== year ||
    validationDate.getUTCMonth() !== month - 1 ||
    validationDate.getUTCDate() !== day
  ) {
    throw new Error(`Invalid ${label}: ${value}`);
  }

  return { year, monthIndex: month - 1, day };
}

function parseRequiredDate(value, label) {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }

  return timestamp;
}

function parseOptionalDate(value, label) {
  if (value == null) {
    return null;
  }

  return parseRequiredDate(value, label);
}

function createStartOfDay(value, label) {
  const parsedVietnamDate = parseVietnamDateString(value, label);

  if (parsedVietnamDate) {
    return createBoundaryDate(
      parsedVietnamDate.year,
      parsedVietnamDate.monthIndex,
      parsedVietnamDate.day,
      false,
    );
  }

  const date = new Date(value);
  const timestamp = date.getTime();

  if (!Number.isFinite(timestamp)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }

  const { year, monthIndex, day } = getVietnamDateParts(date);

  return createBoundaryDate(year, monthIndex, day, false);
}

function createEndOfDay(value, label) {
  const parsedVietnamDate = parseVietnamDateString(value, label);

  if (parsedVietnamDate) {
    return createBoundaryDate(
      parsedVietnamDate.year,
      parsedVietnamDate.monthIndex,
      parsedVietnamDate.day,
      true,
    );
  }

  const date = new Date(value);
  const timestamp = date.getTime();

  if (!Number.isFinite(timestamp)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }

  const { year, monthIndex, day } = getVietnamDateParts(date);

  return createBoundaryDate(year, monthIndex, day, true);
}

function resolveHistoryFilters(query = {}, now = new Date()) {
  if (query.startDate || query.endDate) {
    return {
      startDate: query.startDate ? createStartOfDay(query.startDate, "startDate") : null,
      endDate: query.endDate ? createEndOfDay(query.endDate, "endDate") : null,
    };
  }

  const { year, monthIndex } = getVietnamDateParts(now);
  const monthValue = Number(query.month ?? monthIndex + 1);
  const yearValue = Number(query.year ?? year);

  if (!Number.isInteger(monthValue) || monthValue < 1 || monthValue > 12) {
    throw new Error(`Invalid month: ${query.month}`);
  }

  if (!Number.isInteger(yearValue) || yearValue < 1) {
    throw new Error(`Invalid year: ${query.year}`);
  }

  return {
    startDate: createBoundaryDate(yearValue, monthValue - 1, 1, false),
    endDate: createBoundaryDate(yearValue, monthValue, 0, true),
  };
}

function hasPaymentTransaction(booking) {
  if (toNumber(booking.amount_paid) <= 0) {
    return false;
  }

  if (booking.payment_recorded_at != null || booking.payment_completed_at != null) {
    return true;
  }

  return booking.payment_status != null && booking.payment_status !== "unpaid";
}

function hasRefundTransaction(booking) {
  return booking.refunded_at != null;
}

function getPaymentTransactionDate(booking) {
  return booking.payment_recorded_at || booking.payment_completed_at || booking.createdAt;
}

function createTransaction(booking, type, transactionDate) {
  parseRequiredDate(transactionDate, "transaction date");
  const stadiumName =
    booking?.stadium?.name || booking?.field?.stadium?.name || null;
  const fieldName = booking?.field?.name || null;
  const amount = toNumber(booking.amount_paid);

  return {
    bookingId: booking.id,
    bookingStatus: booking.status,
    type,
    amount,
    refundAmount: type === "refund" ? amount : 0,
    actualRevenue: type === "payment" ? amount : 0,
    transactionDate,
    stadiumName,
    fieldName,
    paymentMethod: booking.payment_method || null,
    refundReason: type === "refund" ? booking.refund_reason || null : null,
    userName: booking?.user?.name || null,
    userPhone: booking?.user?.phone || null,
    status: type === "refund" ? "refunded" : booking.payment_status || "paid",
  };
}

function buildPaymentHistoryTransactions(bookings) {
  const transactions = [];

  for (const booking of bookings) {
    if (hasPaymentTransaction(booking)) {
      transactions.push(
        createTransaction(booking, "payment", getPaymentTransactionDate(booking)),
      );
    }

    if (hasRefundTransaction(booking)) {
      transactions.push(createTransaction(booking, "refund", booking.refunded_at));
    }
  }

  return transactions.sort((left, right) => {
    return (
      parseRequiredDate(right.transactionDate, "transaction date") -
      parseRequiredDate(left.transactionDate, "transaction date")
    );
  });
}

function filterTransactionsByDateRange(transactions, startDate, endDate) {
  const startTime = parseOptionalDate(startDate, "startDate");
  const endTime = parseOptionalDate(endDate, "endDate");

  return transactions.filter((transaction) => {
    const transactionTime = parseRequiredDate(transaction.transactionDate, "transaction date");

    if (startTime !== null && transactionTime < startTime) {
      return false;
    }

    if (endTime !== null && transactionTime > endTime) {
      return false;
    }

    return true;
  });
}

function paginateTransactions(transactions, page, pageSize) {
  const pageInput =
    typeof page === "object" && page !== null ? page.page ?? page.currentPage : page;
  const pageSizeInput =
    typeof page === "object" && page !== null ? page.limit ?? page.pageSize : pageSize;
  const normalizedPage = Number(pageInput);
  const normalizedPageSize = Number(pageSizeInput);
  const safePage = Number.isInteger(normalizedPage) && normalizedPage > 0 ? normalizedPage : 1;
  const safePageSize =
    Number.isInteger(normalizedPageSize) && normalizedPageSize > 0 ? normalizedPageSize : 1;
  const startIndex = (safePage - 1) * safePageSize;

  return transactions.slice(startIndex, startIndex + safePageSize);
}

function getPaymentHistoryPage(bookings, options = {}) {
  const filters = resolveHistoryFilters(options, options.now);
  const transactions = filterTransactionsByDateRange(
    buildPaymentHistoryTransactions(bookings),
    filters.startDate,
    filters.endDate,
  );
  const pageSize = options.limit ?? options.pageSize;

  return {
    totalTransactions: transactions.length,
    transactions: paginateTransactions(transactions, options.page, pageSize),
  };
}

module.exports = {
  buildPaymentHistoryTransactions,
  filterTransactionsByDateRange,
  getPaymentHistoryPage,
  hasPaymentTransaction,
  hasRefundTransaction,
  paginateTransactions,
  resolveHistoryFilters,
  toNumber,
};

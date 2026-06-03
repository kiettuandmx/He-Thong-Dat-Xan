import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getFoodOrderById } from '../services/foodOrderService';

const FoodOrderPaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasShownSuccessModalRef = useRef(false);

  const loadOrder = useCallback(async () => {
    try {
      const response = await getFoodOrderById(orderId);
      setOrder(response.data?.data || null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder().catch(() => {});
  }, [loadOrder]);

  const isPaid = useMemo(() => order?.payment_status === 'paid', [order?.payment_status]);

  useEffect(() => {
    if (!order || isPaid) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      loadOrder().catch(() => {});
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isPaid, loadOrder, order]);

  useEffect(() => {
    if (!isPaid || hasShownSuccessModalRef.current) {
      return;
    }

    hasShownSuccessModalRef.current = true;
    Swal.fire({
      title: 'Thanh toán món thành công',
      text: 'Hệ thống đã xác nhận thanh toán cho order món. Nhấn OK để quay lại chi tiết booking.',
      icon: 'success',
      confirmButtonText: 'OK',
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonColor: '#198754',
    }).then(() => {
      navigate(`/history/${order.booking_id}`);
    });
  }, [isPaid, navigate, order?.booking_id]);

  if (loading) {
    return <div className="text-center mt-5">Đang tải thanh toán order món...</div>;
  }

  const ownerBank = order?.booking?.field?.stadium?.owner;
  const bankId = ownerBank?.bank_name ? String(ownerBank.bank_name).trim() : '';
  const accountNo = ownerBank?.bank_account ? String(ownerBank.bank_account).trim() : '';
  const accountName = ownerBank?.name ? String(ownerBank.name).trim() : '';
  const hasOwnerBankAccount = Boolean(bankId && accountNo && accountName);
  const amount = Number(order?.total_amount || 0);
  const paymentReference = order?.payment_reference || `FO${order?.booking_id}-${order?.id}`;
  const qrUrl = hasOwnerBankAccount
    ? `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(paymentReference)}&accountName=${encodeURIComponent(accountName)}`
    : null;

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-sm border-0 rounded-4 p-4 text-center">
            <h4 className="fw-bold mb-1">Thanh toán order món</h4>
            <p className="text-muted small mb-3">Order món #{order?.id}</p>

            {!hasOwnerBankAccount && (
              <div className="alert alert-warning py-2 small mb-3">
                Chủ sân này chưa cập nhật tài khoản nhận tiền.
              </div>
            )}

            {isPaid && (
              <div className="alert alert-success py-2 small mb-3">
                Hệ thống đã xác nhận thanh toán order món thành công.
              </div>
            )}

            {hasOwnerBankAccount && (
              <div className="bg-light p-3 rounded-4 mb-3">
                <img src={qrUrl} alt="QR Code order món" className="img-fluid" style={{ maxHeight: '300px' }} />
              </div>
            )}

            <div className="text-start mb-4">
              <div className="d-flex justify-content-between mb-2 small">
                <span>Ngân hàng nhận:</span>
                <span>{hasOwnerBankAccount ? bankId : 'Chưa cấu hình'}</span>
              </div>
              <div className="d-flex justify-content-between mb-2 small">
                <span>Số tài khoản:</span>
                <span>{hasOwnerBankAccount ? accountNo : 'Chưa cấu hình'}</span>
              </div>
              <div className="d-flex justify-content-between mb-2 small">
                <span>Chủ tài khoản:</span>
                <span>{hasOwnerBankAccount ? accountName : 'Chưa cấu hình'}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Số tiền:</span>
                <span className="fw-bold text-danger">{amount.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="d-flex justify-content-between mb-2 small">
                <span>Nội dung:</span>
                <span className="text-primary">{paymentReference}</span>
              </div>
            </div>

            {!isPaid && hasOwnerBankAccount && (
              <button className="btn btn-outline-primary w-100 rounded-pill py-2 mb-2" type="button" disabled>
                Đang chờ ngân hàng xác nhận giao dịch
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodOrderPaymentPage;

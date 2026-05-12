import React from 'react';

const Contact = () => {
  return (
    <div className="container mt-5 mb-5">
      <div className="text-center mb-5">
        <h1 className="fw-bold" style={{ letterSpacing: '0.08em' }}>
            LIÊN HỆ
        </h1>
        <p className="text-muted fs-5">S.BOOK</p>
      </div>

      <div className="row align-items-center gy-4">
        <div className="col-lg-6">
          <div className="row g-4">
            <div className="col-12">
              <div className="d-flex gap-3 p-4 rounded-4 shadow-sm" style={{ backgroundColor: '#f5fbff' }}>
                <div className="d-flex align-items-center justify-content-center rounded-4" style={{ width: '70px', height: '70px', backgroundColor: '#e7f7ff' }}>
                  <i className="bi bi-geo-alt-fill fs-3 text-primary"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-1">Địa chỉ</h5>
                  <p className="text-muted mb-0">
                    Lô E1, Khu Công nghệ cao TP.HCM, 
                    Phường Hiệp Phú, Thành phố Thủ Đức (quận 9 cũ), 
                    TP. Hồ Chí Minh
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex gap-3 p-4 rounded-4 shadow-sm" style={{ backgroundColor: '#f5fff3' }}>
                <div className="d-flex align-items-center justify-content-center rounded-4" style={{ width: '70px', height: '70px', backgroundColor: '#ecf9ed' }}>
                  <i className="bi bi-telephone-fill fs-3 text-success"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-1">Số điện thoại</h5>
                  <p className="text-muted mb-0">Hotline CSKH: <span className="text-success">0967 373 003</span></p>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex gap-3 p-4 rounded-4 shadow-sm" style={{ backgroundColor: '#fff8f5' }}>
                <div className="d-flex align-items-center justify-content-center rounded-4" style={{ width: '70px', height: '70px', backgroundColor: '#fff1ed' }}>
                  <i className="bi bi-envelope-fill fs-3 text-danger"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-1">Email</h5>
                  <p className="text-muted mb-0">support@sbook.vn</p>
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="d-flex gap-3 p-4 rounded-4 shadow-sm" style={{ backgroundColor: '#f9f7ff' }}>
                <div className="d-flex align-items-center justify-content-center rounded-4" style={{ width: '70px', height: '70px', backgroundColor: '#f1efff' }}>
                  <i className="bi bi-question-circle-fill fs-3 text-primary"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-1">Giải đáp</h5>
                  <p className="text-muted mb-0">
                    Nếu bạn có câu hỏi, đừng ngần ngại liên hệ với chúng tôi. S.BOOK luôn sẵn sàng hỗ trợ mọi thắc mắc của bạn.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6 text-center">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle shadow-lg"
            style={{
              width: '260px',
              height: '260px',
              background: 'radial-gradient(circle at top left, #ef4444 0%, #b91c1c 70%)',
              color: '#ffffff',
            }}
          >
            <div>
              <h2 className="fw-bold mb-1">S.BOOK</h2>
              <p className="mb-0">Hệ thống đặt sân chuyên nghiệp</p>
            </div>
          </div>

          <p className="text-muted mt-4" style={{ lineHeight: 1.9 }}>
            Chúng tôi luôn lắng nghe ý kiến, đề xuất và phản hồi của bạn. Hãy gửi cho chúng tôi thông tin chi tiết để nhận được hỗ trợ nhanh chóng.
          </p>

          <div className="d-flex justify-content-center gap-3 mt-4">
            <button type="button" className="btn btn-outline-primary rounded-pill px-4">
              Messenger
            </button>
            <button type="button" className="btn btn-outline-success rounded-pill px-4">
              Zalo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

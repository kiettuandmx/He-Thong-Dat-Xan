import React from 'react';

const formatCurrency = (value) => Number(value || 0).toLocaleString('vi-VN');

const FoodOrderPicker = ({ items = [], selections = {}, onIncrease, onDecrease }) => {
  const subtotal = items.reduce((sum, item) => {
    const quantity = selections[item.id] || 0;
    return sum + Number(item.price || 0) * quantity;
  }, 0);

  return (
    <section className="food-order-picker">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="h5 fw-bold mb-1">Đồ ăn và nước uống</h3>
          <p className="text-muted mb-0">Chọn món trước hoặc gọi thêm trong lúc chơi.</p>
        </div>
        <strong>{formatCurrency(subtotal)}đ</strong>
      </div>

      <div className="row g-3">
        {items.map((item) => {
          const quantity = selections[item.id] || 0;
          return (
            <div key={item.id} className="col-md-6">
              <div className="food-order-card">
                {item.image && (
                  <img
                    alt={item.name}
                    className="food-order-card__image"
                    src={item.image}
                  />
                )}
                <div className="food-order-card__body">
                  <div>
                    <h4 className="h6 fw-bold mb-1">{item.name}</h4>
                    <div className="small text-muted mb-2">{formatCurrency(item.price)}đ</div>
                    {!item.is_available && <span className="badge text-bg-secondary">Hết món</span>}
                  </div>
                  <div className="food-order-card__actions">
                    <button
                      aria-label={`Giảm ${item.name}`}
                      className="secondary-button"
                      disabled={quantity <= 0 || !item.is_available}
                      onClick={() => onDecrease(item.id)}
                      type="button"
                    >
                      -
                    </button>
                    <span className="food-order-card__quantity">{quantity}</span>
                    <button
                      aria-label={`Tăng ${item.name}`}
                      className="primary-button"
                      disabled={!item.is_available}
                      onClick={() => onIncrease(item.id)}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FoodOrderPicker;

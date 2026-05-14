import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FieldCard from '../components/FieldCard';
import { FIELD_TYPES, isFieldType } from '../constants/fieldTypes';

const BadmintonPage = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  const backendUrl = 'http://localhost:5000';

  useEffect(() => {
    const fetchBadmintonFields = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/fields`);
        const badmintonOnly = res.data.filter((field) =>
          isFieldType(field.type, FIELD_TYPES.BADMINTON)
        );

        setFields(badmintonOnly);
      } catch (err) {
        console.error('Lỗi tải sân badminton:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBadmintonFields();
  }, []);

  return (
    <div className="container py-5">
      <div className="mb-5 p-5 bg-dark text-white rounded-5 shadow-lg position-relative overflow-hidden">
        <div className="position-relative" style={{ zIndex: 1 }}>
          <h1 className="display-4 fw-bold">Sân Cầu Lông</h1>
          <p className="lead opacity-75">
            Sân thảm chất lượng cao, trần cao thoáng mát cho lông thủ
          </p>
        </div>
        <i
          className="bi bi-shuttlecock-fill position-absolute text-info opacity-25"
          style={{
            fontSize: '200px',
            right: '-50px',
            bottom: '-50px',
            pointerEvents: 'none',
          }}
        ></i>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status"></div>
          <p className="mt-2 text-muted">Đang tìm sân cầu lông...</p>
        </div>
      ) : (
        <div className="row g-4">
          {fields.length > 0 ? (
            fields.map((field) => {
              const fileName = field.images?.[0]?.image_url;
              let fullImageUrl =
                'https://images.unsplash.com/photo-1626224484214-4051d0449511?q=80&w=800';

              if (fileName) {
                fullImageUrl = fileName.startsWith('http')
                  ? fileName
                  : `${backendUrl}/uploads/${fileName}`;
              }

              return (
                <div className="col-md-6 col-lg-4" key={field.id}>
                  <FieldCard
                    field={{
                      id: field.id,
                      name: field.name,
                      address:
                        field.stadium?.location?.address ||
                        field.address ||
                        'TP. Hồ Chí Minh',
                      type: field.type,
                      price: field.price_per_hour,
                      image: fullImageUrl,
                    }}
                  />
                </div>
              );
            })
          ) : (
            <div className="col-12 text-center py-5">
              <i className="bi bi-search display-1 text-muted opacity-25"></i>
              <p className="text-muted fs-5 mt-3">
                Hiện chưa có sân cầu lông nào khả dụng.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BadmintonPage;

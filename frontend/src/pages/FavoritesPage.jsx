import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AccountPageHeader from '../components/AccountPageHeader';
import FieldCard from '../components/FieldCard';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const authData = JSON.parse(localStorage.getItem('user') || 'null');
        const response = await axios.get('http://localhost:5000/api/favorites', {
          headers: {
            Authorization: `Bearer ${authData?.token}`,
          },
        });

        setFavorites(response.data || []);
      } catch (error) {
        console.log(error);
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  return (
    <div className="account-page">
      <AccountPageHeader
        title="Sân yêu thích"
        description="Lưu lại những sân bạn muốn đặt lại nhanh hơn trong lần tiếp theo."
      />

      {loading ? (
        <div className="account-empty-state">Đang tải danh sách sân yêu thích...</div>
      ) : favorites.length === 0 ? (
        <div className="account-empty-state">
          Bạn chưa lưu sân nào. Hãy khám phá danh sách sân để thêm mục yêu thích.
        </div>
      ) : (
        <div className="listing-results__grid">
          {favorites.map((favorite) => (
            <FieldCard
              key={favorite.id}
              field={{
                id: favorite.field.id,
                name: favorite.field.name,
                address:
                  favorite.field?.stadium?.name ||
                  favorite.field?.stadium?.location?.address ||
                  'TP. Hồ Chí Minh',
                price: Number(favorite.field.price_per_hour || 0),
                image: favorite.field.images?.[0]?.image_url?.startsWith('http')
                  ? favorite.field.images[0].image_url
                  : `http://localhost:5000/uploads/${favorite.field.images?.[0]?.image_url || ''}`,
                type: favorite.field.type,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FieldCard from '../components/FieldCard';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);

  const fetchFavorites = async () => {
    try {
      const authData = JSON.parse(localStorage.getItem('user'));

      const res = await axios.get('http://localhost:5000/api/favorites', {
        headers: {
          Authorization: `Bearer ${authData?.token}`,
        },
      });

      setFavorites(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  return (
    <div className="container py-4">
      <h3 className="fw-bold mb-4 text-center">Danh sách sân yêu thích</h3>

      <div className="row g-4">
        {favorites.length > 0 ? (
          favorites.map((fav) => (
            <div className="col-md-4" key={fav.id}>
              <FieldCard
                field={{
                  id: fav.field.id,
                  name: fav.field.name,
                  address: fav.field?.stadium?.name || '',
                  price: fav.field.price_per_hour,
                  image: fav.field.images?.[0]?.image_url?.startsWith('http')
                    ? fav.field.images[0].image_url
                    : `http://localhost:5000/uploads/${fav.field.images?.[0]?.image_url || ''}`,
                  type: fav.field.type,
                }}
              />
            </div>
          ))
        ) : (
          <p className="text-center text-muted">
            Bạn chưa có sân yêu thích nào
          </p>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;

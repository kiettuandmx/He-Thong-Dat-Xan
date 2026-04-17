import React from 'react';
import MainLayout from './components/MainLayout';
import FieldListPage from './pages/FieldListPage';
import 'bootstrap/dist/css/bootstrap.min.css'; // Đảm bảo bạn đã cài bootstrap

function App() {
  return (
    <MainLayout>
      <FieldListPage />
    </MainLayout>
  );
}

export default App;

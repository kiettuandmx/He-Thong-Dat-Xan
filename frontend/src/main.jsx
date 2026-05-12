import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// 1. Nạp Bootstrap trước (Nền tảng)
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// 2. Nạp App (Logic)
import App from './App.jsx';

// 3. Nạp CSS của Lam CUỐI CÙNG (Để nó có quyền đè màu Bootstrap)
import './index.css'; 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
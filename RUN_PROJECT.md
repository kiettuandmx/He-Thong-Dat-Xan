# Chạy Project

File này dùng để nhắc nhanh cách chạy project vào những lần sau.

## 1. Chạy web cơ bản

Mở `2 terminal`.

### Terminal 1: Backend
```powershell
cd C:\workspace\DoAnCoSo\He-Thong-Dat-Xan-develop\backend
npm run dev
```

### Terminal 2: Frontend
```powershell
cd C:\workspace\DoAnCoSo\He-Thong-Dat-Xan-develop\frontend
npm run dev
```

Mở web tại:
```text
http://localhost:5173
```

## 2. Chạy thêm chatbox AI

Mở thêm `1 terminal` nữa.

### Terminal 3: GraphRAG service
```powershell
cd C:\workspace\DoAnCoSo\He-Thong-Dat-Xan-develop
C:\laragon6.0\bin\python\python-3.10\python.exe -m uvicorn app.main:app --reload --port 8000 --app-dir graphrag-service
```

Ghi nhớ:
- Nếu muốn dùng chatbox, phải chạy `backend + frontend + graphrag-service`
- Nếu chatbox lỗi, kiểm tra trước tiên là terminal GraphRAG còn đang chạy hay không

## 3. Chạy thêm SePay webhook

Mở thêm `1 terminal` nữa.

### Terminal 4: ngrok
```powershell
& 'C:\Users\Admin\AppData\Local\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe' http 5000
```

Sau khi chạy, `ngrok` sẽ hiện một URL kiểu:
```text
https://xxxxx.ngrok-free.dev
```

URL webhook SePay phải là:
```text
https://xxxxx.ngrok-free.dev/api/payments/sepay/webhook
```

Ghi nhớ:
- Muốn test SePay thật, phải giữ `backend` và `ngrok` chạy liên tục
- Không được tắt cửa sổ `ngrok` trong lúc test

## 4. Tóm gọn theo mục đích

### Chỉ chạy web
Chạy:
- `backend`
- `frontend`

### Chạy web + chatbox
Chạy:
- `backend`
- `frontend`
- `graphrag-service`

### Chạy full để test SePay
Chạy:
- `backend`
- `frontend`
- `graphrag-service`
- `ngrok`

## 5. Biến môi trường quan trọng

### Backend
File:
```text
backend/.env
```

Cần có:
```env
SEPAY_WEBHOOK_SECRET=sbook-sepay-2026
```

### GraphRAG
File:
```text
graphrag-service/.env
```

Cần có:
```env
OPENROUTER_API_KEY=...
```

## 6. Nếu gặp lỗi

### Chatbox không trả lời
Kiểm tra:
- `backend` có đang chạy không
- `graphrag-service` có đang chạy không
- `OPENROUTER_API_KEY` có còn đúng không

### SePay không gọi vào được
Kiểm tra:
- `backend` có đang chạy không
- `ngrok` có đang chạy không
- URL webhook SePay có đúng dạng `https://.../api/payments/sepay/webhook` không
- `SEPAY_WEBHOOK_SECRET` trong `backend/.env` có khớp với API Key trên SePay không

### Web không mở được
Kiểm tra:
- frontend có đang chạy không
- mở đúng URL `http://localhost:5173`

## 7. Thứ tự nên chạy

Khuyên dùng thứ tự này:

1. Chạy `backend`
2. Chạy `frontend`
3. Chạy `graphrag-service` nếu cần chatbox
4. Chạy `ngrok` nếu cần test SePay


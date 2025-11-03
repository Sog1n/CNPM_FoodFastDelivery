# Quick Fix Guide - Xóa Duplicate Orders

## Nếu bạn đang gặp vấn đề duplicate orders

### Cách 1: Chạy Migration Scripts (Recommended)

```bash
# Windows CMD
cd backend
node migrations\remove-duplicate-orders.js
node migrations\add-payment-unique-index.js
```

### Cách 2: Manual fix qua MongoDB Compass/Shell

1. **Xóa tất cả đơn hàng duplicate**
   ```javascript
   // Trong MongoDB shell hoặc Compass
   db.orders.aggregate([
     {
       $group: {
         _id: "$paymentId",
         orders: { $push: { id: "$_id", createdAt: "$createdAt" } },
         count: { $sum: 1 }
       }
     },
     {
       $match: { count: { $gt: 1 } }
     }
   ])
   
   // Sau đó xóa các duplicate manually
   ```

2. **Thêm unique index**
   ```javascript
   db.orders.createIndex({ paymentId: 1 }, { unique: true })
   ```

### Cách 3: Xóa toàn bộ và test lại

**⚠️ CHỈ dùng cho môi trường development!**

```javascript
// Xóa toàn bộ orders và payments
db.orders.deleteMany({})
db.payments.deleteMany({})

// Thêm unique index
db.orders.createIndex({ paymentId: 1 }, { unique: true })
```

## Verify Fix

Sau khi fix, test lại bằng cách:

1. Đặt hàng mới qua VNPay
2. Refresh trang PaymentSuccess nhiều lần
3. Kiểm tra database:
   ```javascript
   // Đếm số orders cho mỗi paymentId
   db.orders.aggregate([
     {
       $group: {
         _id: "$paymentId",
         count: { $sum: 1 }
       }
     },
     {
       $match: { count: { $gt: 1 } }
     }
   ])
   // Kết quả phải là empty array []
   ```

4. Check index đã có chưa:
   ```javascript
   db.orders.getIndexes()
   // Phải có index: { paymentId: 1 } với unique: true
   ```

## Nếu vẫn còn lỗi

1. Clear cache browser (Ctrl + Shift + Del)
2. Clear sessionStorage: F12 → Application → Session Storage → Clear
3. Restart backend server
4. Test lại từ đầu

## Contact

Nếu vẫn gặp vấn đề, kiểm tra:
- Console logs trong browser (F12)
- Backend logs trong terminal
- MongoDB connection status


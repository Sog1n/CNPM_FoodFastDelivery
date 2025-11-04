# Unit Test Documentation - Payment Routes (VNPay)

## Tổng quan
File test này kiểm tra các chức năng liên quan đến payment system, đặc biệt là tích hợp VNPay payment gateway.

## Thông tin test
- **File test**: `__tests__/UnitTest/PaymentRoutes.test.js`
- **Tổng số test cases**: 39
- **Trạng thái**: ✅ All tests passed
- **Thời gian chạy**: ~0.4s

## Cấu trúc test

### 1. Payment Amount Calculations (4 tests)
Kiểm tra việc tính toán số tiền thanh toán.

- ✅ `should calculate correct Razorpay amount in paise`
  - Tính toán chính xác số tiền Razorpay (đơn vị paise)
  - Input: Products với price và quantity
  - Expected: 25 USD = 2500 paise

- ✅ `should convert USD to VND for VNPay`
  - Chuyển đổi USD sang VND cho VNPay
  - Tỷ giá: 1 USD = 23,000 VND
  - 20 USD = 46,000,000 (VND * 100)

- ✅ `should convert VND back to USD`
  - Chuyển đổi ngược từ VND sang USD
  - 46,000,000 = 20 USD

- ✅ `should handle decimal amounts correctly`
  - Xử lý số tiền có phần thập phân
  - (15.5 * 3) + (20 * 2) = 86.5

### 2. VNPay Payment URL Generation (3 tests)
Kiểm tra việc tạo URL thanh toán VNPay.

- ✅ `should generate correct VNPay payment URL parameters`
  - Tạo đúng các tham số VNPay
  - Kiểm tra: Version, Command, Amount, TxnRef, Currency

- ✅ `should generate secure hash for VNPay params`
  - Tạo secure hash SHA512
  - Hash length phải là 128 ký tự

- ✅ `should sort VNPay parameters correctly`
  - Sắp xếp tham số theo thứ tự alphabet
  - Order: vnp_Amount → vnp_Command → vnp_TxnRef → vnp_Version

### 3. VNPay Response Code Handling (3 tests)
Xử lý các mã phản hồi từ VNPay.

- ✅ `should identify successful payment (code 00)`
  - Nhận diện giao dịch thành công
  - Response code '00' = Success

- ✅ `should identify failed payment codes`
  - Nhận diện các mã lỗi
  - Failed codes: '07', '09', '10', '11', '12', '24', '51', '65', '75', '79', '99'

- ✅ `should map response codes to messages`
  - Mapping mã phản hồi sang thông báo tiếng Việt
  - '00': Success, '24': Khách hàng hủy giao dịch, etc.

### 4. VNPay Signature Verification (4 tests)
Xác thực chữ ký điện tử VNPay.

- ✅ `should verify valid VNPay signature`
  - Xác minh chữ ký hợp lệ
  - Original hash === Verify hash

- ✅ `should detect tampered VNPay data`
  - Phát hiện dữ liệu bị can thiệp
  - Thay đổi amount → Hash khác nhau

- ✅ `should detect tampered response code`
  - Phát hiện response code bị sửa đổi
  - '24' → '00' sẽ tạo hash khác

- ✅ `should handle empty secure hash correctly`
  - Xử lý trường hợp hash rỗng
  - Empty hash ≠ Calculated hash

### 5. Payment Model Validation (4 tests)
Kiểm tra validation của Payment model.

- ✅ `should validate VNPay payment method enum`
  - Valid methods: 'Razorpay', 'VNPay'

- ✅ `should reject invalid payment method`
  - Từ chối payment method không hợp lệ

- ✅ `should have correct default payment method`
  - Default = 'Razorpay'

- ✅ `should validate payment status values`
  - Valid statuses: 'pending', 'paid', 'failed', 'created'

### 6. VNPay IPN Response Format (5 tests)
Định dạng response cho IPN (Instant Payment Notification).

- ✅ `should return correct success response format`
  - { RspCode: '00', Message: 'Success' }

- ✅ `should return correct order not found response`
  - { RspCode: '01', Message: 'Order not found' }

- ✅ `should return correct order confirmed response`
  - { RspCode: '02', Message: 'Order already confirmed' }

- ✅ `should return correct invalid signature response`
  - { RspCode: '97', Message: 'Invalid signature' }

- ✅ `should return correct unknown error response`
  - { RspCode: '99', Message: 'Unknown error' }

### 7. VNPay Date Format (2 tests)
Định dạng ngày tháng cho VNPay.

- ✅ `should format date correctly for VNPay (yyyyMMddHHmmss)`
  - 2024-11-04T12:34:56 → '20241104123456'

- ✅ `should handle single digit dates correctly`
  - 2024-01-05T08:09:07 → '20240105080907'
  - Padding với '0' cho số đơn

### 8. VNPay Payment Flow Logic (4 tests)
Luồng xử lý thanh toán VNPay.

- ✅ `should process complete VNPay payment flow`
  - Bước 1: Tạo payment URL
  - Bước 2: User thanh toán
  - Bước 3: Verify signature
  - Bước 4: Check response code

- ✅ `should handle failed payment flow`
  - Response code '24' = User cancelled
  - isSuccess = false, isCancelled = true

- ✅ `should prevent duplicate order creation`
  - Kiểm tra orderId đã tồn tại

- ✅ `should allow new order creation`
  - OrderId mới chưa tồn tại trong hệ thống

### 9. Payment Data Structure (3 tests)
Cấu trúc dữ liệu payment.

- ✅ `should have correct VNPay payment structure`
  - Bao gồm: orderId, ownerId, paymentId, signature, amount, orderItems, useraddress, payStatus, paymentMethod, paymentDate

- ✅ `should validate order items structure`
  - Mỗi item có: itemId, name, quantity, price
  - quantity > 0, price > 0

- ✅ `should validate user address structure`
  - Có các field: street, city, district, country, postalCode

### 10. VNPay URL Building (2 tests)
Xây dựng URL thanh toán VNPay.

- ✅ `should build complete VNPay URL with all parameters`
  - Base URL + Query string
  - Bao gồm tất cả tham số và secure hash

- ✅ `should encode special characters in URL`
  - Space → %20
  - # → %23

### 11. Error Handling (3 tests)
Xử lý lỗi và edge cases.

- ✅ `should handle missing required VNPay parameters`
  - Kiểm tra các trường bắt buộc
  - Required: vnp_Version, vnp_Command, vnp_TmnCode, vnp_Amount, vnp_TxnRef

- ✅ `should validate amount is greater than zero`
  - Amount phải > 0
  - Reject: 0, negative values

- ✅ `should handle VNPay service timeout`
  - Timeout = 10 seconds
  - Nếu elapsed > timeout → isTimedOut = true

### 12. Payment Model Schema Tests (2 tests)
Kiểm tra schema của Payment model.

- ✅ `should have correct schema structure`
  - PaymentMethod enum: ['Razorpay', 'VNPay']
  - Default: 'Razorpay'

- ✅ `should support strict:false for dynamic VNPay fields`
  - Cho phép thêm các field động từ VNPay
  - vnp_TxnRef, vnp_Amount, vnp_ResponseCode, vnp_TransactionNo, vnp_BankCode, vnp_CardType

## Các chức năng được kiểm tra

### VNPay Payment Gateway
1. **Tạo payment URL**
   - Generate order ID
   - Calculate VND amount (USD * 23,000 * 100)
   - Create secure hash (SHA512)
   - Build complete payment URL

2. **Xử lý payment return**
   - Verify secure hash
   - Check response code
   - Redirect dựa trên kết quả

3. **IPN (Instant Payment Notification)**
   - Xác thực signature
   - Cập nhật payment status
   - Response với format chuẩn

4. **Verify and create order**
   - Kiểm tra duplicate
   - Tạo payment record
   - Convert VND về USD

### Security Features
1. **Signature verification**
   - SHA512 HMAC
   - Parameter sorting
   - Tamper detection

2. **Data validation**
   - Required fields check
   - Amount validation
   - Enum validation

3. **Error handling**
   - Timeout handling
   - Missing parameters
   - Invalid data

## Environment Variables Required
```env
VNP_TMN_CODE=<Your_Terminal_Code>
VNP_HASH_SECRET=<Your_Secret_Key>
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:5000/api/payment/vnpay_return
FRONTEND_URL=http://localhost:3000
```

## VNPay Response Codes
| Code | Meaning |
|------|---------|
| 00 | Giao dịch thành công |
| 07 | Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo) |
| 09 | Thẻ/Tài khoản chưa đăng ký InternetBanking |
| 10 | Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần |
| 11 | Đã hết hạn chờ thanh toán |
| 12 | Thẻ/Tài khoản bị khóa |
| 24 | Khách hàng hủy giao dịch |
| 51 | Tài khoản không đủ số dư |
| 65 | Vượt quá hạn mức giao dịch trong ngày |
| 75 | Ngân hàng thanh toán đang bảo trì |
| 79 | KH nhập sai mật khẩu thanh toán quá số lần quy định |
| 99 | Các lỗi khác |

## VNPay IPN Response Codes
| RspCode | Meaning |
|---------|---------|
| 00 | Success |
| 01 | Order not found |
| 02 | Order already confirmed |
| 97 | Invalid signature |
| 99 | Unknown error |

## Cách chạy test

```bash
# Chạy test đơn lẻ
npm test -- __tests__/UnitTest/PaymentRoutes.test.js

# Chạy với coverage
npm test -- __tests__/UnitTest/PaymentRoutes.test.js --coverage

# Chạy trong watch mode
npm test -- __tests__/UnitTest/PaymentRoutes.test.js --watch
```

## Kết quả test

```
Test Suites: 1 passed, 1 total
Tests:       39 passed, 39 total
Snapshots:   0 total
Time:        ~0.4s
```

## Dependencies
- `jest`: Testing framework
- `crypto`: Tạo secure hash
- `qs`: Query string parsing và building

## Notes
- Tests này là **unit tests** thuần túy, không cần database connection
- Tập trung vào logic validation và business rules
- Không test actual API calls (đó là integration tests)
- Sử dụng helper functions để test VNPay security features

## Tác giả
- File được tạo: 04/11/2024
- Purpose: Unit testing cho VNPay payment integration
- Status: ✅ Production ready


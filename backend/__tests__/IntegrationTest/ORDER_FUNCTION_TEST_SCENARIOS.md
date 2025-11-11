# TÀI LIỆU KỊCH BẢN TEST CHỨC NĂNG ĐẶT MÓN ĂN (FOOD ORDER FUNCTION)

Ngày cập nhật: 11/11/2025  
Phiên bản: 1.0  
Phạm vi: Luồng đặt món từ lúc khách đăng nhập → duyệt nhà hàng → chọn món → giỏ hàng → thanh toán (VNPay/Razorpay) → tạo đơn → theo dõi trạng thái → hủy / hoàn tất.

## 1. Mục tiêu
- Bảo đảm luồng đặt món ăn hoạt động đúng với Activity Diagram đã cung cấp.
- Xác minh các nhánh quyết định (decision points): tìm kiếm nhà hàng, thêm món lặp lại, thành công/thất bại thanh toán.
- Phát hiện & ghi nhận GAP (ví dụ: cho đặt hàng với payment thất bại, menu vẫn hiển thị khi nhà hàng đóng cửa, chưa kiểm tra payStatus trước khi tạo order).

## 2. Phạm vi chức năng
1. Đăng nhập khách hàng (Authentication User)  
2. Khám phá danh sách nhà hàng / tìm kiếm  
3. Xem chi tiết nhà hàng + thực đơn  
4. Thêm món vào giỏ (multi-add loop)  
5. Tính tổng tiền giỏ hàng  
6. Thanh toán VNPay / Razorpay  
7. Xử lý kết quả thanh toán (success / fail)  
8. Tạo đơn hàng (order create) & ngăn duplicate paymentId  
9. Lấy lịch sử đơn hàng / theo dõi trạng thái  
10. Hủy đơn khi còn pending  
11. Edge: số lượng âm, item out-of-stock, nhà hàng đóng cửa, payment thất bại, thiếu trường bắt buộc.

## 3. Định dạng Test Case
| Cột | Diễn giải |
|-----|-----------|
| TC-ID | Mã định danh duy nhất (ORD-, CART-, PAY-, FLOW-, EDGE-, SEC-) |
| Mục tiêu | Mô tả ngắn gọn mục đích kiểm thử |
| Preconditions | Trạng thái / dữ liệu ban đầu cần có |
| Steps | Các bước thực thi |
| Expected Result | Kết quả mong muốn |
| Priority | H / M / L |
| Type | F (Functional), N (Negative), E (Edge), S (Security), P (Performance) |

---
## 4. Danh sách kịch bản chi tiết
### 4.1 Authentication & Khởi tạo
| TC-ID | Mục tiêu | Preconditions | Steps | Expected Result | Priority | Type |
|-------|----------|--------------|-------|-----------------|----------|------|
| ORD-AUTH-01 | Đăng ký user mới | Email chưa tồn tại | POST /user/register | 200 + message success | H | F |
| ORD-AUTH-02 | Đăng nhập hợp lệ | User đã đăng ký | POST /UserLogin | 200 + token cookie | H | F |
| ORD-AUTH-03 | Đăng nhập sai mật khẩu | User tồn tại | POST /UserLogin sai password | 400/401 message lỗi | H | N |
| ORD-AUTH-04 | Không token truy cập route cần auth | Chưa login | GET /ResMenu/:id | 401 | H | S |

### 4.2 Khám phá nhà hàng & Tìm kiếm
| TC-ID | Mục tiêu | Preconditions | Steps | Expected Result | Priority | Type |
| ORD-RES-01 | Lấy danh sách nhà hàng | Có ≥1 nhà hàng | GET /Restaurants | 200 array | H | F |
| ORD-RES-02 | Tìm kiếm theo tên (chuỗi tồn tại) | Danh sách có "Delicious" | GET /Restaurants + filter client | Kết quả chứa nhà hàng mong muốn | H | F |
| ORD-RES-03 | Tìm kiếm không khớp | Danh sách nhà hàng có sẵn | GET /Restaurants + filter "khong_ton_tai" | 0 kết quả | M | N |
| ORD-RES-04 | Nhà hàng đóng cửa vẫn hiển thị menu (GAP) | isOpen=false | Set isOpen=false, GET /ResMenu/:id | Vẫn trả menu (ghi nhận GAP) | M | E |

### 4.3 Xem thực đơn & Chi tiết
| TC-ID | Mục tiêu | Preconditions | Steps | Expected Result | Priority | Type |
| ORD-MENU-01 | Tạo món trong thực đơn (restaurant) | Restaurant login | POST /ResMenu | 200 món tạo mới | H | F |
| ORD-MENU-02 | Xem menu theo restaurantId (user) | Có món đã tạo | GET /ResMenu/:resId | 200 array món | H | F |
| ORD-MENU-03 | Món không tồn tại (ID sai) | ID giả | GET /EditMenu/:fake | 404 | M | N |
| ORD-MENU-04 | Món out-of-stock | inStock=false | GET /ResMenu/:resId | Item có flag inStock=false (UI cần ẩn / disable) | M | E |

### 4.4 Giỏ hàng (Cart Loop)
| TC-ID | Mục tiêu | Preconditions | Steps | Expected Result | Priority | Type |
| CART-01 | Thêm món đầu tiên | Menu trả về >=1 món | Push item vào cart | Cart length=1 | H | F |
| CART-02 | Thêm nhiều món (loop) | Cart có 1 món | Push thêm món 2,3 | Cart length tăng tương ứng | H | F |
| CART-03 | Không thêm nữa (decision NO) | Cart có ≥1 món | Dừng vòng lặp | Cart giữ nguyên | H | F |
| CART-04 | Quantity âm | Item test | Add quantity=-1 | Validation fail / bỏ qua tính total | H | N |
| CART-05 | Quantity=0 | Item test | Add quantity=0 | Subtotal=0 hoặc bỏ qua | M | E |
| CART-06 | Tính tổng tiền | Cart có nhiều item | Reduce tổng (price*qty) | Kết quả chính xác | H | F |
| CART-07 | Rounding tiền (nếu dùng thuế/giảm giá) | Có logic rounding | Áp dụng rounding | Kết quả tuân chuẩn làm tròn | L | E |

### 4.5 Thanh toán VNPay / Razorpay
| TC-ID | Mục tiêu | Preconditions | Steps | Expected Result | Priority | Type |
| PAY-VNP-01 | Khởi tạo VNPay URL | Có tổng tiền tính trước | POST /payment/vnpay/create_payment_url | 200 + paymentUrl | H | F |
| PAY-VNP-02 | Thanh toán VNPay thành công | Callback code=00 | GET /payment/vnpay_return?code=00 | Redirect success page | H | F |
| PAY-VNP-03 | Thanh toán VNPay thất bại | Callback code !=00 | GET /payment/vnpay_return?code=24 | Redirect failed page | H | N |
| PAY-VNP-04 | IPN hợp lệ | VNPay gửi checksum đúng | GET /payment/vnpay_ipn | 200 RspCode=00 | M | F |
| PAY-VNP-05 | IPN checksum sai | checksum giả | GET /payment/vnpay_ipn | RspCode=97 invalid signature | H | S |
| PAY-RZP-01 | Checkout Razorpay tạo order | Products hợp lệ | POST /payment/checkout | 200 orderId + amount | H | F |
| PAY-RZP-02 | Verify Razorpay thành công | Có order + paymentId + signature | POST /payment/verify-payment | 200 success | H | F |
| PAY-RZP-03 | Verify sai chữ ký | signature giả | POST /payment/verify-payment | 400 invalid signature | H | N |

### 4.6 Tạo đơn hàng (Order Creation)
| TC-ID | Mục tiêu | Preconditions | Steps | Expected Result | Priority | Type |
| ORD-CRT-01 | Tạo đơn sau payment thành công | payment payStatus=success | POST /newOrder đầy đủ trường | 200 đơn hàng mới | H | F |
| ORD-CRT-02 | Duplicate paymentId | Đơn đã tồn tại | POST /newOrder lặp paymentId | 200 message "Order already created" | H | E |
| ORD-CRT-03 | Thiếu deliveryAddress | Có payment thành công | POST /newOrder thiếu deliveryAddress | 400/500 validation error | H | N |
| ORD-CRT-04 | Thiếu totalAmount | Có deliveryAddress | POST /newOrder thiếu totalAmount | 400/500 validation | H | N |
| ORD-CRT-05 | Payment thất bại vẫn tạo đơn (GAP) | payStatus=failed | POST /newOrder | (Hiện tại) vẫn 200 -> cần fix sau | M | GAP |
| ORD-CRT-06 | Trường orderItems rỗng | payment hợp lệ | POST /newOrder orderItems=[] | 400 invalid data | H | N |
| ORD-CRT-07 | Giá trị quantity lớn bất thường | payment hợp lệ | quantity=10^6 | 400 hoặc giới hạn | M | E |

### 4.7 Theo dõi & Lấy đơn hàng
| TC-ID | Mục tiêu | Preconditions | Steps | Expected Result | Priority | Type |
| ORD-TRK-01 | Lấy đơn theo user | User login + có đơn | GET /getOrdersByUserId | 200 array đơn | H | F |
| ORD-TRK-02 | Lấy đơn theo restaurant | Restaurant login + có đơn | GET /getOrdersByResId/:id | 200 array | M | F |
| ORD-TRK-03 | Lịch sử hiển thị chính xác | Có nhiều đơn | GET /getOrdersByUserId sort desc | Đơn mới nhất đầu danh sách | M | F |

### 4.8 Hủy đơn hàng
| TC-ID | Mục tiêu | Preconditions | Steps | Expected Result | Priority | Type |
| ORD-CAN-01 | Hủy đơn trạng thái pending | Đơn pending chính chủ | PUT /cancelOrder/:id | 200 orderStatus=cancel | H | F |
| ORD-CAN-02 | Hủy đơn đã hủy | orderStatus=cancel | PUT /cancelOrder/:id | 400 message error | M | N |
| ORD-CAN-03 | Hủy đơn không phải của user | Đơn thuộc user khác | PUT /cancelOrder/:id | 403 unauthorized | H | S |
| ORD-CAN-04 | Hủy đơn status delivered | delivered | PUT /cancelOrder/:id | 400 not allowed | M | N |

### 4.9 Bảo mật & Truy cập
| TC-ID | Mục tiêu | Preconditions | Steps | Expected Result | Priority | Type |
| SEC-ORD-01 | Không token tạo đơn | No login | POST /newOrder | 401 | H | S |
| SEC-ORD-02 | User token truy cập route dành cho restaurant (update status) | User login | PUT /updateOrder/:id | 401/403 | H | S |
| SEC-ORD-03 | Đặt hàng với JWT giả mạo | Token sai signature | POST /newOrder | 401 invalid token | H | S |
| SEC-ORD-04 | Truy cập đơn của user khác | Có 2 user | GET /getOrdersByUserId khi token user2 | Không thấy đơn user1 | M | S |

### 4.10 Hiệu năng & Tính ổn định (tuỳ chọn)
| TC-ID | Mục tiêu | Preconditions | Steps | Expected Result | Priority | Type |
| PERF-ORD-01 | Thời gian tạo đơn trung bình | 10 đơn hợp lệ | Đo thời gian POST /newOrder | < X ms (ngưỡng) | L | P |
| PERF-ORD-02 | Tải nhiều món (cart lớn) | 100 items | POST /newOrder | Thời gian vẫn ổn định, không timeout | L | P |
| PERF-ORD-03 | Đồng thời tạo đơn (race) | N user song song | Kích hoạt N POST cùng paymentId khác nhau | Không duplicate ngoài paymentId | M | P |

---
## 5. Luồng End-to-End Tổng hợp
| Scenario | Các bước | Kết quả mong đợi |
|----------|----------|------------------|
| FLOW-E2E-01 Razorpay | AUTH → GET Restaurants → GET Menu → Build cart → /payment/checkout → /payment/verify-payment → /newOrder → /getOrdersByUserId | Đơn tạo, không duplicate, trạng thái pending |
| FLOW-E2E-02 VNPay Success | AUTH → GET Restaurants → GET Menu → Cart → create_payment_url → return success → verify-and-create (nếu có) → /newOrder (nếu chưa) | Đơn + payment payStatus=success |
| FLOW-E2E-03 VNPay Fail | AUTH → Cart → create_payment_url → return fail → Không tạo đơn | Không tồn tại Order với payment thất bại |
| FLOW-E2E-04 Cancel Path | FLOW-E2E-01 đến pending → /cancelOrder/:id | Status cancel, không thể hủy lại |
| FLOW-E2E-05 Duplicate Payment | Tạo Payment → /newOrder → POST /newOrder lần 2 cùng paymentId | Message "Order already created" |

---
## 6. Mapping sang Mã Hiện Có
| Nhóm | Đã được cover bởi file `CompleteOrderFlow.test.js` | Chưa cover / GAP |
|------|-----------------------------------------------|----------------------|
| Auth | ORD-AUTH-01/02 | ORD-AUTH-03 (cần test login sai) |
| Restaurant/List | ORD-RES-01/02/03 | ORD-RES-04 (isOpen) |
| Menu | ORD-MENU-02 | ORD-MENU-01/03/04 |
| Cart | CART-01..03,06 | CART-04,05,07 |
| Payment | PAY-VNP phần logic đơn giản mock | PAY-VNP-04/05, Razorpay full verify chữ ký |
| Order Creation | ORD-CRT-01/02/03/04 (partial) | ORD-CRT-05/06/07 |
| Tracking | ORD-TRK-01 (lịch sử đơn) | ORD-TRK-02/03 |
| Cancellation | ORD-CAN-01/02 | ORD-CAN-03/04 |
| Security | SEC-ORD-01 (no token) | SEC-ORD-02/03/04 |
| Performance | Chưa | PERF-ORD-01..03 |

## 7. Đề xuất Bổ sung Code Test
1. Tạo `PaymentFailureGuard.test.js` kiểm tra không cho tạo đơn với payment payStatus=failed (sau khi sửa logic).  
2. Thêm test cho login sai / JWT giả mạo (dùng token tùy chỉnh).  
3. Thêm test restaurant isOpen=false không cho lấy menu (nếu yêu cầu nghiệp vụ).  
4. Thêm test out-of-stock (giả lập trường inStock).  
5. Thêm test hiệu năng: đo thời gian tạo 50 đơn bằng vòng lặp (Jest perf snapshot).  
6. Thêm test concurrency: Promise.all tạo nhiều đơn song song với các paymentId khác nhau.

## 8. Tiêu chí Pass
- ≥ 95% test High Priority pass.  
- Không còn GAP nghiêm trọng (đặc biệt ORD-CRT-05).  
- Duplicate order không xảy ra ngoài các case chủ động test.  

## 9. Rủi ro & Lưu ý
- Sử dụng cơ sở dữ liệu thật có thể gây nhiễu (khuyến nghị dùng in-memory / database riêng).  
- Các test phụ thuộc thời gian (Date.now) cần chuẩn hóa hoặc mock.  
- VNPay & Razorpay signature nên mock để tránh gọi mạng thực.  

## 10. Checklist Chuẩn Bị
- [ ] Seed nhà hàng + menu mẫu.  
- [ ] Có user test đăng nhập.  
- [ ] Thiết lập biến môi trường KEY, VNP_* cho test giả lập.  
- [ ] Script dọn dữ liệu trước/sau test.  
- [ ] Thống nhất format tiền tệ (VND vs USD) trong assertions.  

## 11. Phần Mở Rộng Trong Tương Lai
- Thêm Drone assignment vào luồng đặt hàng (shipping -> delivered).  
- Thêm real-time tracking qua Socket.IO và test event emission.  
- Thêm coupon/khuyến mãi, kiểm tra tính tổng tiền sau giảm.  
- Thêm kiểm thử tải (stress) với k6 or Artillery.

---
## 12. Phụ lục: Mã Đặt Tên TC
Prefix:  
- ORD-AUTH: Authentication user order flow  
- ORD-RES: Restaurant listing/search  
- ORD-MENU: Menu operations  
- CART: Cart build & calculation  
- PAY-VNP / PAY-RZP: Payment gateways  
- ORD-CRT: Order creation  
- ORD-TRK: Tracking & history  
- ORD-CAN: Cancellation  
- SEC-ORD: Security  
- PERF-ORD: Performance  
- FLOW-E2E: End-to-end scenario chain

END OF DOCUMENT


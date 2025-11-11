# TEST SCENARIOS - FOOD FAST DELIVERY SYSTEM

Ngày cập nhật: 11/11/2025  
Phiên bản: 1.0  
Phạm vi: Backend API & Luồng nghiệp vụ chính (Authentication → Checkout → Payment → Order → Fulfillment)

## 1. Quy ước
- TC-ID: Mã test case (nhóm_chức_năng + số) ví dụ: AUTH-01
- Mức ưu tiên: H (High), M (Medium), L (Low)
- Loại: Functional (F), Negative (N), Edge (E), Security (S), Performance (P)
- Tiền điều kiện (Preconditions): Trạng thái hệ thống/ dữ liệu cần trước khi chạy
- Dữ liệu mẫu minh họa, có thể thay đổi bằng fixtures

---
## 2. Nhóm Authentication (User / Restaurant / Delivery)
| TC-ID | Mục tiêu | Preconditions | Steps | Expected Result | Priority | Type |
|-------|----------|--------------|-------|-----------------|----------|------|
| AUTH-01 | Đăng ký user mới | Email chưa tồn tại | 1. POST /user/register với email+password hợp lệ 2. Kiểm tra response | 201 hoặc 200 với dữ liệu user, hash password không lộ | H | F |
| AUTH-02 | Đăng nhập user hợp lệ | User đã tồn tại | 1. POST /UserLogin 2. Lưu token/cookie | 200, trả về token hợp lệ, set-cookie | H | F |
| AUTH-03 | Đăng nhập sai mật khẩu | User đã tồn tại | 1. POST /UserLogin với sai password | 401 hoặc 400, message lỗi | H | N |
| AUTH-04 | Đăng ký trùng email | User đã tồn tại | 1. POST /user/register cùng email | 409 hoặc 400 hoặc message duplicate | M | N |
| AUTH-05 | Token user truy cập /api/restaurant/orders | User login, restaurant route yêu cầu nhà hàng | 1. GET /getOrdersByResId/:id với user token | 403/401 Access denied | H | S |
| AUTH-06 | Đăng ký nhà hàng | restaurantName chưa tồn tại | POST /restaurant/register | 200 + dữ liệu nhà hàng | H | F |
| AUTH-07 | Đăng nhập delivery partner | Delivery user đã tạo | POST /DelLogin | 200 + token | M | F |
| AUTH-08 | Reset password flow user | User đã đăng ký | 1. POST /UserForgotPasswordDialog 2. Nhận token reset 3. POST /UserResetPassword/:token | 200 password thay đổi, login được với mới | M | F |
| AUTH-09 | Token hết hạn | Token tạo với TTL ngắn | 1. Gọi protected route sau khi TTL 2. Kiểm tra | 401 expired | M | S |
| AUTH-10 | Không gửi token | Không login | GET protected route | 401 yêu cầu đăng nhập | H | S |

---
## 3. Menu & Restaurant Listing
| TC-ID | Mục tiêu | Preconditions | Steps | Expected | Priority | Type |
| MENU-01 | Lấy danh sách menu công khai | Menu có dữ liệu | GET /api/menu | 200 list items | H | F |
| MENU-02 | Lọc theo restaurant | Có nhiều restaurant | GET /api/menu?restaurant=<id> | 200 chỉ items của nhà hàng đó | M | F |
| MENU-03 | Item không tồn tại | ID không đúng | GET /api/menu/:id | 404 not found | L | N |
| MENU-04 | Tạo món mới (restaurant) | Restaurant login | POST /api/menu với token | 201 created | H | F |
| MENU-05 | User thường tạo menu | User login | POST /api/menu | 403/401 denied | H | S |

---
## 4. Checkout (Razorpay Flow)
| TC-ID | Mục tiêu | Preconditions | Steps | Expected | Priority | Type |
| CHK-01 | Checkout với sản phẩm hợp lệ | Có ít nhất 1 product (id, price) | POST /payment/checkout {products:[{id, name, price, qty}]} | 200 order object có amount | H | F |
| CHK-02 | Tổng tiền nhiều sản phẩm | 2+ products | POST checkout | amount = Σ price*qty chính xác | H | F |
| CHK-03 | Empty products array | Không sản phẩm | POST checkout {products:[]} | 400 hoặc message lỗi "Empty products" | H | N |
| CHK-04 | Thiếu field price | Product thiếu price | POST checkout | 400 validation error | M | N |
| CHK-05 | Qty âm | qty = -1 | POST checkout | 400 invalid quantity | H | E |
| CHK-06 | Nhiều session checkout liên tiếp | User login | POST checkout 2 lần khác nhau | Tạo 2 payment records riêng | M | F |
| CHK-07 | Checkout không login (public) | Không token | POST checkout | 200 phản hồi hợp lệ (nếu business cho phép) | M | F |

---
## 5. Payment Verification (Razorpay)
| TC-ID | Mục tiêu | Preconditions | Steps | Expected | Priority | Type |
| PAY-01 | Verify payment hợp lệ | Có order + razorpayPaymentId + signature | POST /payment/verify-payment | 200 status verified | H | F |
| PAY-02 | Sai chữ ký | Modify signature | POST verify | 400 invalid signature | H | N |
| PAY-03 | Lặp lại verify cùng paymentId | Đã verify trước | POST verify lần 2 | 200 hoặc thông báo "Already verified" | M | E |
| PAY-04 | Missing payment fields | Bỏ razorpayPaymentId | POST verify | 400 validation error | M | N |

---
## 6. VNPay Payment Flow
| TC-ID | Mục tiêu | Preconditions | Steps | Expected | Priority | Type |
| VNP-01 | Tạo URL thanh toán VNPay | User login hoặc public nếu cho phép | POST /payment/vnpay/create_payment_url | 200 trả về redirect URL có vnp_ params | H | F |
| VNP-02 | Return URL xử lý thành công | Có transaction success từ VNPay | GET /payment/vnpay_return?vnp_ResponseCode=00 | 200 trạng thái success | H | F |
| VNP-03 | Return thất bại | vnp_ResponseCode != 00 | GET vnpay_return | 400/ message fail | M | N |
| VNP-04 | IPN xác thực hợp lệ | VNPay server mô phỏng | GET /payment/vnpay_ipn với checksum đúng | 200 cập nhật trạng thái payment | H | F |
| VNP-05 | IPN checksum sai | Cheksum không khớp | GET vnpay_ipn | 400 reject | H | S |
| VNP-06 | Verify and create order | Payment đã xác thực | POST /payment/vnpay/verify-and-create | 200 order tạo mới | H | F |
| VNP-07 | Duplicate order theo paymentId | Đã có order | POST verify-and-create lần 2 | 200 trả về order cũ (không tạo mới) | M | E |

---
## 7. Order Creation & Management
| TC-ID | Mục tiêu | Preconditions | Steps | Expected | Priority | Type |
| ORD-01 | Tạo order mới từ payment | User login + payment verified | POST /newOrder với paymentId chưa dùng | 200 order tạo mới | H | F |
| ORD-02 | Duplicate sử dụng lại paymentId | Order đã tồn tại | POST /newOrder với paymentId cũ | 200 message "Order already created" | H | E |
| ORD-03 | Thiếu orderItems | User login | POST /newOrder không orderItems | 400 invalid data | H | N |
| ORD-04 | Lấy orders theo restaurant | Restaurant login + có orders | GET /getOrdersByResId/:id | 200 danh sách orders | H | F |
| ORD-05 | Lấy orders theo user | User login | GET /getOrdersByUserId | 200 danh sách user orders | H | F |
| ORD-06 | Cập nhật status order | Restaurant login | PUT /updateOrderStatus/:id (confirmed) | 200 status thay đổi | H | F |
| ORD-07 | Gán delivery man | Restaurant login + delivery user | PUT /assignDeliveryMan/:id | 200 order có deliveryMan | M | F |
| ORD-08 | Gán drone | Restaurant login + drone AVAILABLE | PUT /assignDrone/:id | 200 droneId set | H | F |
| ORD-09 | Gán drone khi drone MAINTENANCE | Drone status MAINTENANCE | PUT assignDrone | 400/422 không cho phép | M | N |
| ORD-10 | Hủy order (cancel) | Order status pending | PUT /cancelOrder/:id | 200 status = cancelled | M | F |
| ORD-11 | Hủy order sau delivered | Status delivered | PUT cancel | 400 không cho phép | M | N |
| ORD-12 | Cập nhật order sai ID | ID không tồn tại | PUT /updateOrder/:fake | 404 not found | L | N |

---
## 8. Drone Management
| TC-ID | Mục tiêu | Preconditions | Steps | Expected | Priority | Type |
| DRN-01 | Tạo drone mới | Admin/Restaurant (theo policy) | POST /api/drones | 201 drone created | M | F |
| DRN-02 | Lấy danh sách drone | Có >=1 drone | GET /api/drones | 200 list | M | F |
| DRN-03 | Cập nhật status drone | Drone tồn tại | PATCH /api/drones/:id/status body {status:IN_DELIVERY} | 200 status cập nhật | M | F |
| DRN-04 | Xóa drone | Drone tồn tại | DELETE /api/drones/:id | 200 deleted | L | F |
| DRN-05 | Cập nhật status invalid | Gửi status không hợp lệ | PATCH drone | 400 validation | M | N |
| DRN-06 | Assign drone vượt tải (nếu có logic capacity) | Drone capacity full | PUT assignDrone | 400 limit exceeded | L | E |

---
## 9. Delivery User Flow
| TC-ID | Mục tiêu | Preconditions | Steps | Expected | Priority | Type |
| DEL-01 | Delivery đăng nhập | Delivery user tồn tại | POST /DelLogin | 200 token | M | F |
| DEL-02 | Xem dashboard | Có token | GET /DelLayout/DelDashboard | 200 dữ liệu dashboard | M | F |
| DEL-03 | Quên mật khẩu | Delivery user tồn tại | POST /DelForgotPasswordDialog | 200 gửi mail (mock) | M | F |
| DEL-04 | Reset password | Có token reset | POST /DelResetPassword/:token | 200 cập nhật | M | F |
| DEL-05 | Token user truy cập delivery route | User token | GET /DelLayout/DelDashboard | 403 denied | H | S |

---
## 10. Tracking & Completion
| TC-ID | Mục tiêu | Preconditions | Steps | Expected | Priority | Type |
| TRK-01 | User theo dõi order status | Order tồn tại | Poll GET /getOrdersByUserId | Status phản ánh cập nhật (pending→confirmed→delivered) | H | F |
| TRK-02 | Sau khi drone giao thành công | Order assigned + status IN_DELIVERY | PUT /updateOrderStatus/:id delivered | 200 status=delivered | H | F |
| TRK-03 | Refresh trạng thái liên tục | Order thay đổi nhanh | Thực hiện nhiều GET | Không lỗi race condition, trạng thái nhất quán | M | P |

---
## 11. Security & Access Control
| TC-ID | Mục tiêu | Preconditions | Steps | Expected | Priority | Type |
| SEC-01 | Không token truy cập protected route | None | GET /getOrdersByResId/:id | 401 | H | S |
| SEC-02 | User token truy cập restaurant route | User login | GET /getOrdersByResId/:id | 403 | H | S |
| SEC-03 | Restaurant token truy cập user-only route | Restaurant login | GET /UsersOrders | 403/401 | H | S |
| SEC-04 | JWT giả mạo | Sửa payload | GET protected route | 401 invalid signature | H | S |
| SEC-05 | Replay token cũ sau logout | Token đã logout (nếu blacklist) | GET protected | 401 (nếu triển khai) | M | S |

---
## 12. Negative & Edge Cases Tổng hợp
| TC-ID | Mục tiêu | Preconditions | Steps | Expected | Priority | Type |
| NEG-01 | Payment verify thiếu signature | Payment created | POST verify-payment không signature | 400 error | H | N |
| NEG-02 | OrderItems số lượng cực lớn | qty=10^6 | POST /newOrder | 400 hoặc kiểm soát giới hạn | M | E |
| NEG-03 | Product price = 0 | Product test | Checkout product price=0 | 400 hoặc xử lý miễn phí hợp lệ | L | E |
| NEG-04 | Network chậm payment verify | Giả lập delay | POST verify | Timeout hoặc xử lý retry (nếu có) | L | P |
| NEG-05 | IPN gửi trùng nhiều lần | IPN đã xử lý | Gửi lại IPN | Idempotent: không tạo thêm thay đổi | M | E |

---
## 13. Kịch bản End-to-End Chuỗi Chính
| Scenario-ID | Mục tiêu | Steps | Expected |
|-------------|----------|-------|----------|
| E2E-01 | User đặt hàng Razorpay full flow | 1. AUTH-01/02 2. MENU-01 chọn items 3. CHK-01 4. PAY-01 5. ORD-01 6. TRK-01 status cập nhật đến delivered | Order lifecycle hoàn chỉnh, không duplication |
| E2E-02 | User đặt hàng VNPay full flow | 1. AUTH-02 2. MENU-02 chọn items 3. VNP-01 redirect 4. VNP-02 return success 5. VNP-06 tạo order 6. ORD-04 restaurant xem 7. ORD-08 assign drone 8. TRK-02 delivered | Tích hợp VNPay & fulfillment hoạt động |
| E2E-03 | Hủy đơn trước chuẩn bị | 1. E2E-01 đến pending 2. ORD-10 cancel | Status cancelled, không chuyển đến confirmed |
| E2E-04 | Double payment verify bảo vệ | 1. CHK-01 2. PAY-01 3. PAY-03 | Lần 2 không gây side-effect |
| E2E-05 | Drone assignment + delivery completion | 1. ORD-01 2. ORD-08 assign drone 3. TRK-02 delivered | Drone gán & order hoàn tất |

---
## 14. Mapping sang Test Tự động (gợi ý)
- Jest + Supertest cho các TC API (AUTH-01.. SEC-04)
- Integration test hiện có đã bao phủ CHK-01.. CHK-07, PAY-01.. PAY-04, ORD-01.. ORD-02
- Bổ sung test mới: VNPay flow (VNP-01.. VNP-07), Drone edge (DRN-06), Security replay token nếu triển khai blacklist

## 15. Tiêu chí Hoàn thành Bộ Test
- ≥ 95% test chính (High priority) phải pass
- Không còn lỗi Critical/High mở
- Idempotent bảo đảm với duplicate verify & IPN

## 16. Đề xuất Mở Rộng
- Thêm performance test thời gian phản hồi checkout
- Thêm contract test cho VNPay callback
- Thêm chaos test (mất kết nối giữa verify và order creation)

---
## 17. Ghi chú
Cập nhật test cases khi logic thay đổi (ví dụ thêm trạng thái order mới, thêm bảo mật token refresh). Các mã TC giữ nguyên để trace lịch sử.

END OF FILE


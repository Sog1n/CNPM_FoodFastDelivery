# TEST PLAN - Food Fast Delivery System

Date: 11/11/2025
Version: 1.0
Author: QA Automation (Generated)
Scope: Backend APIs (Authentication, Menu, Payment, Order, Delivery/Drone, Address) & End-to-End Order Flow

## 1. Introduction
The purpose of this Test Plan is to define the strategy, scope, objectives, resources, schedule, and execution approach for testing the Food Fast Delivery System. The system enables users to browse restaurants, select menu items, perform checkout via payment gateways (Razorpay, VNPay), create orders, assign delivery/drone, track fulfillment, and cancel orders.

## 2. Objectives
- Validate functional correctness of all exposed API endpoints.
- Ensure end-to-end ordering flow matches the Activity Diagram (login → browse → select → cart → payment → order creation → tracking → completion/cancel).
- Prevent duplicate order creation via unique payment mapping (`paymentId` uniqueness).
- Verify security/access control boundaries between roles: User, Restaurant, Delivery Partner, Drone operations.
- Identify gaps in current implementation (e.g., allowing order creation after failed payment, missing stock check).
- Provide repeatable automated integration tests using Jest & Supertest.

## 3. In-Scope
- User, Restaurant, Delivery registration/login/logout/reset password flows.
- Menu management (create, update, delete, toggle stock, retrieval by restaurant).
- Payment flows: Razorpay checkout & verify, VNPay create URL, return, IPN, verify-and-create.
- Order lifecycle: create, update status, assign deliveryman, assign drone, list by role, cancellation.
- Delivery address creation and retrieval.
- Drone CRUD & status updates.
- Security: Unauthorized access, cross-role authorization, token validation.
- Basic negative/edge cases.

## 4. Out-of-Scope (Current Phase)
- Frontend UI rendering & styling tests.
- Load/stress testing at production scale.
- Real external calls to Razorpay / VNPay (will mock signatures/IDs).
- Real email delivery verification (nodemailer results are mocked by success response).
- Real-time WebSocket tracking (future extension).

## 5. Test Items
APIs under base paths:
- `/auth` (User, Restaurant, Delivery)
- `/api/menu` (Menu operations)
- `/api/order` (Order operations)
- `/api/payment` (Payment flows)
- `/api/addresses` (Delivery addresses)
- `/api/drones` (Drone management)
- `/api/Restaurants` (Restaurant listing)

Models: `UserModel`, `ResModel`, `DelModel`, `MenuModel`, `Payment`, `OrderModel`, `DelAddressModel`, `DroneModel`.

## 6. Roles & Responsibilities
- QA Engineer: Designs and maintains automated test suites (unit + integration).
- Developer: Fixes defects identified by tests, supports test data seeding.
- DevOps: Maintains CI pipeline (runs `npm test`).
- Product Owner: Approves test scenarios & priorities.

## 7. Test Approach
- Unit Tests: Validate individual route handlers and controller logic where feasible (already present for core routes in `__tests__/UnitTest`).
- Integration Tests: Simulate realistic multi-step flows using in-memory or isolated MongoDB (existing: `AuthenticationFlow.test.js`, `CheckoutIntegration.test.js`, `CompleteOrderFlow.test.js`).
- E2E Simulation (Backend only): Chain endpoints to emulate full user journey without frontend.
- Security Tests: Attempt protected access with missing/invalid tokens and role misuse.
- Data Validation Tests: Edge values (negative quantity, empty products, duplicate paymentId).
- Idempotency: Repeated verify or IPN calls should not create duplicate orders/payments.

## 8. Test Environment
- Technology: Node.js, Express, Mongoose, Jest, Supertest.
- Database: MongoDB test instance (could be local or ephemeral). Recommend using a separate DB name (e.g., `fooddelivery_test`).
- Environment Variables: KEY (JWT secret), VNP_* (VNPay config), FRONTEND_URL, MONGODB_URI.
- Tools: Jest runner (`npm test`), coverage report (existing in `coverage/`).

### 8.1 Environment Configuration
| Variable | Purpose |
|----------|---------|
| KEY | JWT signing for auth tokens |
| MONGODB_URI | Test DB connection string |
| VNP_TMN_CODE, VNP_HASH_SECRET, VNP_URL, VNP_RETURN_URL | VNPay mock flow |
| FRONTEND_URL | Redirect targets for VNPay return |

### 8.2 Test Data Strategy
- Dynamic creation of users/restaurants per test to avoid collision (emails timestamped).
- Reuse seeded restaurants or create ephemeral ones in `beforeAll` hooks.
- Clean up with `clearDatabase()` after each integration test group.

## 9. Entry & Exit Criteria
### Entry
- Code merged builds successfully.
- Critical endpoints accessible.
- Test environment variables configured.

### Exit
- All High Priority test cases pass (≥95%).
- No open Critical severity defects.
- Test coverage for critical controllers ≥ 70%.
- Key E2E scenarios executed successfully.

## 10. Test Case Prioritization
High: Authentication, Checkout, Payment Verify, Order Creation, Cancellation, Security.
Medium: Drone assignment, Address management, VNPay IPN details.
Low: Performance snapshots, extended edge cases (extreme quantities), optional fields.

## 11. Risk Analysis
| Risk | Impact | Mitigation |
|------|--------|------------|
| Duplicate order creation race | Overcharges / inconsistent state | Unique index on `paymentId` (already set), add concurrency test |
| Payment failure still allows order creation | Invalid orders pollute system | Add validation to block orders when `payStatus != paid` |
| Token misuse between roles | Data leakage | Strengthen middleware & add security tests |
| Large cart performance issues | Slow response | Add performance test & optimize calculation |
| Unsanitized input | Security vulnerabilities | Validate and sanitize request bodies |

## 12. Defect Management
- Capture failures in Jest output + logs.
- Tag defects by severity (Critical, High, Medium, Low).
- Use repository issues (if integrated) or external tracker.
- Link failing test case ID to defect for traceability.

## 13. Test Execution Schedule
| Phase | Activities | Timeline |
|-------|-----------|----------|
| Preparation | Review endpoints, update scenarios | Day 1 |
| Automation | Implement missing tests (VNPay, security, edge) | Day 2–3 |
| Execution | Run full suite locally & CI | Day 4 |
| Stabilization | Fix defects, re-run | Day 5 |
| Sign-off | Coverage review & report | Day 6 |

## 14. Reporting
- Daily summary: Pass/Fail counts by category.
- Final report: Coverage %, defect summary, scenario pass matrix.
- Artifacts: `coverage/index.html`, Jest JSON output (if enabled), Test Plan document.

## 15. Test Scenario Overview (Condensed)
Reference detailed scenario catalogs in:
- `__tests__/IntegrationTest/ORDER_FUNCTION_TEST_SCENARIOS.md`
- `__tests__/IntegrationTest/TEST_SCENARIOS_ORDER_FLOW.md`

### Core High Priority Scenarios
1. User Registration & Login (Auth) – TC: ORD-AUTH-01/02, AUTH-01/02.
2. Restaurant Listing & Menu Retrieval – TC: ORD-RES-01/02, MENU-02.
3. Checkout Calculation & Payment Creation – TC: CHK-01/02, PAY-RZP-01.
4. Payment Verification & Idempotency – TC: PAY-RZP-02/03.
5. Order Creation & Duplicate Payment Guard – TC: ORD-CRT-01/02.
6. Order Cancellation (Pending Only) – TC: ORD-CAN-01.
7. Role-Based Access Control – TC: SEC-ORD-01/02/03.
8. VNPay Payment URL & Return – TC: PAY-VNP-01/02.

### Critical Edge Cases
- Negative quantity (CART-04)
- Empty products (CHK-03)
- Invalid price datatype
- Repeated verify-payment
- Payment failure behavior (GAP: ORD-CRT-05)

## 16. Automation Backlog (To Add)
| ID | Description | Status |
|----|-------------|--------|
| AUTO-01 | VNPay IPN success & checksum failure tests | Pending |
| AUTO-02 | Security test: forged JWT signature | Pending |
| AUTO-03 | Order creation blocked if `payStatus != paid` | Pending (needs feature patch) |
| AUTO-04 | Performance snapshot for 50 concurrent orders | Pending |
| AUTO-05 | Drone assignment invalid status (maintenance) | Pending (add logic) |

## 17. Traceability Matrix (Excerpt)
| Requirement | Endpoint | Test Case IDs |
|-------------|----------|---------------|
| Register User | POST /auth/user/register | ORD-AUTH-01, AUTH-01 |
| Login User | POST /auth/UserLogin | ORD-AUTH-02, AUTH-02 |
| Create Menu Item | POST /api/menu/ResMenu | ORD-MENU-01, MENU-04 |
| List Restaurants | GET /auth/Restaurants | ORD-RES-01 |
| Checkout | POST /api/payment/checkout | CHK-01/02, PAY-RZP-01 |
| Verify Payment | POST /api/payment/verify-payment | PAY-RZP-02/03 |
| Create Order | POST /api/order/newOrder | ORD-CRT-01/02 |
| Get User Orders | GET /api/order/getOrdersByUserId | ORD-TRK-01 |
| Cancel Order | PUT /api/order/cancelOrder/:id | ORD-CAN-01 |
| Assign Drone | PUT /api/order/assignDrone/:id | ORD-08 |

## 18. Pending Improvements (GAP List)
| GAP | Description | Recommendation |
|-----|------------|----------------|
| ORD-CRT-05 | Orders can be created regardless of payment status | Validate payment record before creating order |
| Stock Handling | Out-of-stock items not enforced server-side | Add `inStock` check before checkout/order creation |
| Restaurant Open Status | No filtering by `isOpen` | Check `isOpen` when retrieving menu for users |
| Security Logging | Minimal audit trail | Add structured logs for auth failures |

## 19. Tools & Frameworks
- Jest (test runner)
- Supertest (HTTP assertions)
- MongoDB (test DB)
- Nodemailer (mock email sending)
- Cloudinary (image upload – can mock during tests)

## 20. Maintenance
- Review & update test scenarios when models or routes change.
- Keep scenario docs versioned with semantic versioning (e.g., 1.1 after feature updates).
- Integrate with CI pipeline to run tests on each push / pull request.

## 21. Approval
| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | TBD |  |  |
| QA Lead | TBD |  |  |
| Tech Lead | TBD |  |  |

---
END OF TEST PLAN


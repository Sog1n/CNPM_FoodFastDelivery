import express from 'express'
import {
  checkout,
  verify,
  userOrder,
  createVNPayPayment,
  vnpayReturn,
  vnpayIPN,
  vnpayVerifyAndCreateOrder
} from "../Controllers/payment.js";
import { Payment } from "../models/PaymentModel.js";
import {AuthenticateUser} from './UserRoutes.js'

const router = express.Router();

// Razorpay checkout
router.post('/checkout',checkout);

// Razorpay verify payment
router.post('/verify-payment', verify);

// VNPay - Create payment URL
router.post('/vnpay/create_payment_url', createVNPayPayment);

// VNPay - Return URL (after payment)
router.get('/vnpay_return', vnpayReturn);

// VNPay - IPN (Instant Payment Notification)
router.get('/vnpay_ipn', vnpayIPN);

// VNPay - Verify and create order
router.post('/vnpay/verify-and-create', vnpayVerifyAndCreateOrder);

// Get payment by orderId (for VNPay return)
router.get('/vnpay/order/:orderId', async (req, res) => {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId });
    if (payment) {
      res.json(payment);
    } else {
      res.status(404).json({ error: 'Payment not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// user order
router.get("/UsersOrders",AuthenticateUser ,userOrder);

// All orders
//router.get("/UsersOrders",allOrders);
export default router;
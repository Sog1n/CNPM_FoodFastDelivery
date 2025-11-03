import { Payment } from "../models/PaymentModel.js";
import Razorpay from "razorpay";
import dotenv from 'dotenv';
import crypto from 'crypto';
import querystring from 'qs';
import dateFormat from 'dateformat';

dotenv.config()

const razorpay = new Razorpay({
  key_id: 'rzp_test_Jp05EcVr7cQRf3',
  key_secret: 'aXpDOvINq7xksY6otZQRvHX3',
}); 

// checkout
export const checkout = async (req, res) => {
  try {
    const { products , ownerId ,  orderItems , useraddress} = req.body;
    console.log(products);
  
    const amount = products.reduce((total, product) => total + product.price * product.quantity, 0) * 100; // in paise
     console.log(amount)
    var options = {
      amount: amount, // amount in the smallest currency unit
      currency: "USD",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: amount / 100, // in INR
      ownerId,
      orderItems,
      useraddress,
      payStatus: "created",
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// verify , save to db
export const verify = async (req, res) => {
  const {
    orderId,
    ownerId,
    paymentId,
    signature,
    amount,
    orderItems,
    useraddress
  } = req.body;

  let orderConfirm = await Payment.create({
    orderId,
    ownerId,
    paymentId,
    signature,
    amount,
    orderItems,
    useraddress,
    payStatus: "paid",
  });

  res.json({ message: "payment successfull..", success: true, orderConfirm });
};

// user specific order
export const userOrder = async (req, res) => {
  try {
    let ownerId =  req.rootUser._id.toString(); // assuming req.userId is populated by authentication middleware
    console.log(ownerId);
    let orders = await Payment.find({ ownerId: ownerId }).sort({ orderDate: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//All orders
export const allOrders = async (req, res) => {
  try {
    let orders = await Payment.find().sort({ orderDate: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Helper function to sort object
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

// VNPay - Create payment URL
export const createVNPayPayment = async (req, res) => {
  try {
    const { products, orderItems, amount } = req.body;

    // Get IP address
    let ipAddr = req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    // VNPay config from env
    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    let vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    const date = new Date();
    const createDate = dateFormat(date, 'yyyymmddHHMMss');
    const orderId = dateFormat(date, 'yyyymmddHHMMss');

    // Amount in VND (VNPay requires amount in smallest currency unit)
    const vnpAmount = Math.round(amount * 23000 * 100); // Convert USD to VND and multiply by 100

    const locale = 'vn';
    const currCode = 'VND';

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = currCode;
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = `Thanh toan don hang ${orderId}`;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = vnpAmount;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    vnp_Params = sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

    res.json({
      success: true,
      paymentUrl: vnpUrl,
      orderId: orderId
    });

  } catch (error) {
    console.error("Error creating VNPay payment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// VNPay - Return URL handler
export const vnpayReturn = async (req, res) => {
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    const secretKey = process.env.VNP_HASH_SECRET;
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    if (secureHash === signed) {
      const responseCode = vnp_Params['vnp_ResponseCode'];

      if (responseCode === '00') {
        // Payment successful - just redirect, let frontend handle order creation
        const orderId = vnp_Params['vnp_TxnRef'];
        const transactionNo = vnp_Params['vnp_TransactionNo'];
        const amount = vnp_Params['vnp_Amount'] / 100; // Convert back to VND
        const payDate = vnp_Params['vnp_PayDate'];

        // Redirect to success page with payment info
        res.redirect(`${process.env.FRONTEND_URL}/payment-success?orderId=${orderId}&transactionNo=${transactionNo}&amount=${amount}&payDate=${payDate}&secureHash=${secureHash}`);
      } else {
        // Payment failed
        res.redirect(`${process.env.FRONTEND_URL}/payment-failed?code=${responseCode}`);
      }
    } else {
      res.status(400).json({ error: "Invalid signature" });
    }
  } catch (error) {
    console.error("Error processing VNPay return:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// VNPay - IPN (Instant Payment Notification) handler
export const vnpayIPN = async (req, res) => {
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    const secretKey = process.env.VNP_HASH_SECRET;
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    if (secureHash === signed) {
      const orderId = vnp_Params['vnp_TxnRef'];
      const responseCode = vnp_Params['vnp_ResponseCode'];

      // Check if order exists
      const order = await Payment.findOne({ orderId: orderId });

      if (order) {
        if (order.payStatus === 'paid') {
          res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
        } else {
          if (responseCode === '00') {
            // Update order status
            order.payStatus = 'paid';
            await order.save();
            res.status(200).json({ RspCode: '00', Message: 'Success' });
          } else {
            order.payStatus = 'failed';
            await order.save();
            res.status(200).json({ RspCode: '00', Message: 'Success' });
          }
        }
      } else {
        res.status(200).json({ RspCode: '01', Message: 'Order not found' });
      }
    } else {
      res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
    }
  } catch (error) {
    console.error("Error processing VNPay IPN:", error);
    res.status(500).json({ RspCode: '99', Message: 'Unknown error' });
  }
};

// VNPay - Verify and create order
export const vnpayVerifyAndCreateOrder = async (req, res) => {
  try {
    const { orderId, transactionNo, amount, payDate, secureHash, ownerId, orderItems, useraddress } = req.body;

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ orderId: orderId });

    if (existingPayment) {
      return res.status(200).json({
        success: true,
        message: 'Order already created',
        paymentId: existingPayment._id
      });
    }

    // Create payment record
    const paymentRecord = await Payment.create({
      orderId: orderId,
      ownerId: ownerId,
      paymentId: transactionNo,
      signature: secureHash,
      amount: amount / 23000, // Convert VND back to USD
      orderItems: orderItems,
      useraddress: useraddress,
      payStatus: "paid",
      paymentMethod: "VNPay",
      paymentDate: payDate
    });

    res.json({
      success: true,
      message: "VNPay payment verified and order created successfully",
      paymentId: paymentRecord._id
    });
  } catch (error) {
    console.error("Error verifying VNPay payment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
    orderDate: { type: Date, default: Date.now },
    payStatus: { type: String },
    paymentMethod: { type: String, enum: ['Razorpay', 'VNPay'], default: 'Razorpay' },
    paymentDate: { type: String }
}, { strict: false })

export const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;

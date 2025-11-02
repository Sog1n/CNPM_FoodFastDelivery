import mongoose from "mongoose";

const { Schema, model } = mongoose;

const OrderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    restaurant: {
        type: Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true,
    },
    deliveryman: {
        type: Schema.Types.ObjectId,
        ref: "Delivery",
    },
    drone: {
        type: Schema.Types.ObjectId,
        ref: "Drone"
    },
    paymentId: {
        type:Schema.Types.ObjectId,
        ref: "Payment",
        required: true,
    },
    deliveryAddress: {
        type: Schema.Types.ObjectId,
        ref: "DeliveryAddress",
        required: true,
    }, 
    orderStatus: {
        type: String,
        enum: ["pending","confirmed","ready","shipping","delivered","cancel"],
        default: "pending",
    },
    orderItems: [
        {
            item: {
                dishName: {
                    type: String,
                    required: true,
                },
                price: {
                    type: Number,
                    required: true,
                },
            },
            quantity: {
                type: Number,
                required: true,
            },
        },
    ],
    totalAmount: {
        type: Number,
        required: true
    },
}, {
    timestamps: true,
});

const OrderModel = model("Order", OrderSchema);

export default OrderModel;
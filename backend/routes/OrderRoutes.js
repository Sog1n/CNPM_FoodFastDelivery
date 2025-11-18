import express from 'express';
import { AuthenticateUser } from './UserRoutes.js';
import { Authenticate } from './ResRoutes.js'
import { AuthenticateDel } from './DelRoutes.js'
import OrderModel from '../models/OrderModel.js';
import { metrics } from '../middleware/prometheus.middleware.js';

const router = express.Router();

//Route to create a new order
router.post('/newOrder', AuthenticateUser, async (req, res) => {

    try {
        const { restaurant, paymentId, deliveryAddress, orderItems, totalAmount } = req.body;
        console.log("data", req.body);

        // Check if order with this paymentId already exists
        const existingOrder = await OrderModel.findOne({ paymentId: paymentId });
        if (existingOrder) {
            console.log("Order already exists for this payment:", existingOrder._id);
            return res.status(200).json({
                message: "Order already created",
                order: existingOrder
            });
        }

        const order = new OrderModel({
            user: req.UserId,
            restaurant,
            paymentId,
            deliveryAddress,
            orderItems,
            totalAmount
        });

        const newOrder = await order.save();
        console.log("✅ New order saved:", newOrder._id);
        if (newOrder) {
            console.log(`🔥 About to record order metrics: status=pending, totalAmount=${totalAmount}`);
            try {
                // Track metrics
                metrics.recordOrder('pending', totalAmount);
                console.log("✅ Order metrics recorded successfully");
            } catch (metricsError) {
                console.error("❌ Error recording order metrics:", metricsError);
            }
            res.status(200).json(newOrder);
        }
        else {
            res.status(400).json({ error: "Invalid order data" });
        }
    } catch (error) {
        console.log(error);
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(200).json({
                message: "Order already created for this payment"
            });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});


//Route to change order status
router.put('/updateOrder/:id', Authenticate, async (req, res) => {
    try {
        const order = await OrderModel.findById(req.params.id);
        const { orderStatus } = req.body;
        if (order) {
            const oldStatus = order.orderStatus;
            order.orderStatus = orderStatus;
            const updatedOrder = await order.save();

            // Track metrics for status change
            metrics.recordOrder(orderStatus, 0);

            res.status(200).json(updatedOrder);
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

//Route to change order status by delivery man
// router.put('/updateOrderStatus/:id', AuthenticateDel, async (req, res) => {
//     try {
//         const order = await OrderModel.findById(req.params.id);
//         const { orderStatus } = req.body;
//         if (order) {
//             order.orderStatus = orderStatus;
//             const updatedOrder = await order.save();
//             res.status(200).json(updatedOrder);
//         }
//         else {
//             res.status(404).json({ error: "Order not found" });
//         }
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

router.put('/updateOrderStatus/:id', AuthenticateDel, async (req, res) => {
    try {
        const order = await OrderModel.findById(req.params.id);
        const { orderStatus } = req.body;
        if (order) {
            order.orderStatus = orderStatus;
            const updatedOrder = await order.save();

            // Track metrics
            metrics.recordOrder(orderStatus, 0);

            // If delivered, set drone status to AVAILABLE
            if (orderStatus === 'delivered' && order.drone) {
                const DroneModel = (await import('../models/DroneModel.js')).default;
                const drone = await DroneModel.findById(order.drone);
                if (drone) {
                    drone.status = 'AVAILABLE';
                    await drone.save();
                    metrics.recordDroneDelivery('completed');
                }
            }

            res.status(200).json(updatedOrder);
        }
        else {
            res.status(404).json({ error: "Order not found" });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

//Route to assign delivery man to order

router.put('/assignDeliveryMan/:id', AuthenticateDel, async (req, res) => {
    try {
        const order = await OrderModel.findById(req.params.id);
        if (order) {
            order.deliveryman = req.DelId;
            const updatedOrder = await order.save();
            res.status(200).json(updatedOrder);
        } else {
            res.status(404).json({ error: 'Order not found' });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to assign drone to order
router.put('/assignDrone/:id', AuthenticateDel, async (req, res) => {
    try {
        const order = await OrderModel.findById(req.params.id);
        if (order) {
            const droneId = req.body.droneId;
            order.drone = droneId;
            order.orderStatus = 'shipping'; // Change status to shipping when drone is assigned
            await order.save();

            // Track metrics
            metrics.recordOrder('shipping', 0);

            // Update drone status to IN_DELIVERY
            const DroneModel = (await import('../models/DroneModel.js')).default;
            const drone = await DroneModel.findById(droneId);
            if (drone) {
                drone.status = 'IN_DELIVERY';
                await drone.save();
                metrics.recordDroneDelivery('assigned');
            }

            res.status(200).json(order);
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//Route to get orders by restaurant Id

router.get('/getOrdersByResId/:id', Authenticate, async (req, res) => {
    try {
        const orders = await OrderModel.find({ restaurant: req.params.id })
            .select('-__v   -deliveryAddress')
            .populate('user', 'ownerName')
            .populate('paymentId', 'orderId')
            .populate('deliveryman', 'ownerName');

        if (orders) {
            res.status(200).json(orders);
        } else {
            console.log(error);
            res.status(404).json({ error: 'Orders not found' });
        }
    } catch (error) {

        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/getAllDeliveredOrders', AuthenticateDel, async (req, res) => {
    try {
        const orders = await OrderModel.find({ orderStatus: 'delivered' }) // changed from deliveryman
            .select('-__v -drone')
            .populate('user', 'ownerName phone')
            .populate('paymentId', 'orderId')
            .populate('restaurant', 'restaurantName phone city address countryName stateName')
            .populate('deliveryAddress', ' city state address country')

        if (orders) {
            res.status(200).json(orders);
        } else {
            res.status(404).json({ error: 'Orders not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// //Route to get all orders
// router.get('/getAllOrders', AuthenticateDel, async (req, res) => {
//     try {
//
//         const orders = await OrderModel.find({ deliveryman: null })
//             .select('-__v -deliveryman')
//             .populate('user', 'ownerName phone')
//             .populate('paymentId', 'orderId')
//             .populate('restaurant', 'restaurantName phone city address countryName stateName')
//             .populate('deliveryAddress', ' city state address country')
//
//
//         if (orders) {
//             res.status(200).json(orders);
//         } else {
//             res.status(404).json({ error: 'Orders not found' });
//         }
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

router.get('/getAllAcceptedOrders', AuthenticateDel, async (req, res) => {
    try {
        const orders = await OrderModel.find({drone : { $ne: null }}) // changed from deliveryman
            .select('-__v -drone')
            .populate('user', 'ownerName phone')
            .populate('paymentId', 'orderId')
            .populate('restaurant', 'restaurantName phone city address countryName stateName')
            .populate('deliveryAddress', ' city state address country')

        if (orders) {
            res.status(200).json(orders);
        } else {
            res.status(404).json({ error: 'Orders not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/getAllOrders', AuthenticateDel, async (req, res) => {
    try {
        const orders = await OrderModel.find({
            drone: null,
            orderStatus: 'ready'
        }) // Only get ready orders without drone
            .select('-__v -drone')
            .populate('user', 'ownerName phone')
            .populate('paymentId', 'orderId')
            .populate('restaurant', 'restaurantName phone city address countryName stateName')
            .populate('deliveryAddress', ' city state address country')

        if (orders) {
            res.status(200).json(orders);
        } else {
            res.status(404).json({ error: 'Orders not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
//Route to get orders by deliveryman Id

router.get('/getOrdersByDelId/:id', AuthenticateDel, async (req, res) => {
    try {
        const orders = await OrderModel.find({ deliveryman: req.params.id })
            .select('-__v -deliveryman')
            .populate('user', 'ownerName phone')
            .populate('paymentId', 'orderId')
            .populate('restaurant', 'restaurantName phone city address countryName stateName')
            .populate('deliveryAddress');

        if (orders) {
            res.status(200).json(orders);
        } else {
            res.status(404).json({ error: 'Orders not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/getOrdersByDroneId/:id', AuthenticateDel, async (req, res) => {
    try {
        const orders = await OrderModel.find({ drone: req.params.id })
            .select('-__v -drone')
            .populate('user', 'ownerName phone')
            .populate('paymentId', 'orderId')
            .populate('restaurant', 'restaurantName phone city address countryName stateName')
            .populate('deliveryAddress');

        if (orders) {
            res.status(200).json(orders);
        } else {
            res.status(404).json({ error: 'Orders not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to get orders by user Id
router.get('/getOrdersByUserId', AuthenticateUser, async (req, res) => {
    try {
        const orders = await OrderModel.find({ user: req.UserId })
            .select('-__v -user -deliveryAddress')
            .populate('paymentId', 'orderId')
            .populate('restaurant', 'restaurantName')


        if (orders) {
            res.status(200).json(orders);
        } else {
            res.status(404).json({ error: 'Orders not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to cancel order (only for pending orders)
router.put('/cancelOrder/:id', AuthenticateUser, async (req, res) => {
    try {
        const order = await OrderModel.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check if the order belongs to the user
        if (order.user.toString() !== req.UserId.toString()) {
            return res.status(403).json({ error: 'Unauthorized to cancel this order' });
        }

        // Only allow cancellation of pending orders
        if (order.orderStatus !== 'pending') {
            return res.status(400).json({ error: 'Only pending orders can be cancelled' });
        }

        order.orderStatus = 'cancel';
        const updatedOrder = await order.save();

        // Track metrics
        metrics.recordOrder('cancel', 0);

        res.status(200).json(updatedOrder);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

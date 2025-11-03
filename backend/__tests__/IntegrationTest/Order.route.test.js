import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import OrderRoutes from '../../routes/OrderRoutes.js';
import OrderModel from '../../models/OrderModel.js';
import DroneModel from '../../models/DroneModel.js';
import UserModel from '../../models/UserModel.js';
import RestaurantModel from '../../models/ResModel.js';
import DeliveryModel from '../../models/DelModel.js';
import { Payment as PaymentModel } from '../../models/PaymentModel.js';
import DeliveryAddressModel from '../../models/DelAddressModel.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/orders', OrderRoutes);

describe('Order Routes', () => {
    let mongoServer;
    let testUser;
    let testRestaurant;
    let testDelivery;
    let testDrone;
    let testPayment;
    let testAddress;
    let userToken;
    let restaurantToken;
    let deliveryToken;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
        process.env.KEY = 'test-secret-key';
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        // Create test user
        testUser = await UserModel.create({
            ownerName: 'Test User',
            email: 'user@test.com',
            password: 'password123',
            phone: '1234567890'
        });

        // Create test restaurant
        testRestaurant = await RestaurantModel.create({
            ownerName: 'Test Restaurant Owner',
            email: 'restaurant@test.com',
            password: 'password123',
            restaurantName: 'Test Restaurant',
            phone: '0987654321',
            city: 'Ho Chi Minh',
            address: '123 Test St',
            countryName: 'Vietnam',
            stateName: 'Ho Chi Minh'
        });

        // Create test delivery
        testDelivery = await DeliveryModel.create({
            ownerName: 'Test Delivery',
            email: 'delivery@test.com',
            password: 'password123',
            phone: '1112223333',
            drivingLicenceNo: 'DL123456',
            city: 'Ho Chi Minh',
            address: '456 Test St',
            countryName: 'Vietnam',
            stateName: 'Ho Chi Minh'
        });

        // Create test drone
        testDrone = await DroneModel.create({
            droneId: 'DRONE001',
            status: 'AVAILABLE',
            batteryLevel: 100,
            maxPayload: 5
        });

        // Create test payment
        testPayment = await PaymentModel.create({
            orderId: 'ORDER123',
            amount: 100,
            status: 'completed'
        });

        // Create test delivery address
        testAddress = await DeliveryAddressModel.create({
            userId: testUser._id,
            city: 'Ho Chi Minh',
            state: 'Ho Chi Minh',
            address: '789 Test St',
            country: 'Vietnam'
        });

        // Generate tokens
        userToken = jwt.sign({ id: testUser._id }, process.env.KEY, { expiresIn: '1h' });
        restaurantToken = jwt.sign({ id: testRestaurant._id }, process.env.KEY, { expiresIn: '1h' });
        deliveryToken = jwt.sign({ id: testDelivery._id }, process.env.KEY, { expiresIn: '1h' });
    });

    afterEach(async () => {
        await OrderModel.deleteMany({});
        await UserModel.deleteMany({});
        await RestaurantModel.deleteMany({});
        await DeliveryModel.deleteMany({});
        await DroneModel.deleteMany({});
        await PaymentModel.deleteMany({});
        await DeliveryAddressModel.deleteMany({});
    });

    describe('POST /api/orders/newOrder', () => {
        it('should create a new order successfully', async () => {
            const orderData = {
                restaurant: testRestaurant._id,
                paymentId: testPayment._id,
                deliveryAddress: testAddress._id,
                orderItems: [
                    {
                        item: {
                            dishName: 'Test Dish',
                            price: 50
                        },
                        quantity: 2
                    }
                ],
                totalAmount: 100
            };

            const response = await request(app)
                .post('/api/orders/newOrder')
                .set('Cookie', [`token=${userToken}`])
                .send(orderData);

            expect(response.status).toBe(200);
            expect(response.body.user.toString()).toBe(testUser._id.toString());
            expect(response.body.restaurant.toString()).toBe(testRestaurant._id.toString());
            expect(response.body.totalAmount).toBe(100);
            expect(response.body.orderStatus).toBe('pending');
        });

        it('should fail without authentication', async () => {
            const orderData = {
                restaurant: testRestaurant._id,
                paymentId: testPayment._id,
                deliveryAddress: testAddress._id,
                orderItems: [],
                totalAmount: 100
            };

            const response = await request(app)
                .post('/api/orders/newOrder')
                .send(orderData);

            expect(response.status).toBe(401);
        });

        it('should fail with missing required fields', async () => {
            const incompleteOrderData = {
                restaurant: testRestaurant._id,
                // Missing paymentId, deliveryAddress, etc.
            };

            const response = await request(app)
                .post('/api/orders/newOrder')
                .set('Cookie', [`token=${userToken}`])
                .send(incompleteOrderData);

            expect(response.status).toBe(500);
        });
    });

    describe('PUT /api/orders/updateOrder/:id', () => {
        it('should update order status by restaurant', async () => {
            const order = await OrderModel.create({
                user: testUser._id,
                restaurant: testRestaurant._id,
                paymentId: testPayment._id,
                deliveryAddress: testAddress._id,
                orderItems: [
                    {
                        item: {
                            dishName: 'Test Dish',
                            price: 50
                        },
                        quantity: 2
                    }
                ],
                totalAmount: 100,
                orderStatus: 'pending'
            });

            const response = await request(app)
                .put(`/api/orders/updateOrder/${order._id}`)
                .set('Cookie', [`token=${restaurantToken}`])
                .send({ orderStatus: 'confirmed' });

            expect(response.status).toBe(200);
            expect(response.body.orderStatus).toBe('confirmed');
        });

        it('should return 404 for non-existent order', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .put(`/api/orders/updateOrder/${fakeId}`)
                .set('Cookie', [`token=${restaurantToken}`])
                .send({ orderStatus: 'confirmed' });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Order not found');
        });

        it('should fail without authentication', async () => {
            const order = await OrderModel.create({
                user: testUser._id,
                restaurant: testRestaurant._id,
                paymentId: testPayment._id,
                deliveryAddress: testAddress._id,
                orderItems: [],
                totalAmount: 100
            });

            const response = await request(app)
                .put(`/api/orders/updateOrder/${order._id}`)
                .send({ orderStatus: 'confirmed' });

            expect(response.status).toBe(401);
        });
    });

    describe('PUT /api/orders/updateOrderStatus/:id', () => {
        it('should update order status by delivery person', async () => {
            const order = await OrderModel.create({
                user: testUser._id,
                restaurant: testRestaurant._id,
                paymentId: testPayment._id,
                deliveryAddress: testAddress._id,
                orderItems: [
                    {
                        item: {
                            dishName: 'Test Dish',
                            price: 50
                        },
                        quantity: 2
                    }
                ],
                totalAmount: 100,
                orderStatus: 'confirmed',
                drone: testDrone._id
            });

            const response = await request(app)
                .put(`/api/orders/updateOrderStatus/${order._id}`)
                .set('Cookie', [`token=${deliveryToken}`])
                .send({ orderStatus: 'shipping' });

            expect(response.status).toBe(200);
            expect(response.body.orderStatus).toBe('shipping');
        });

        it('should set drone status to AVAILABLE when order is delivered', async () => {
            // Set drone to IN_DELIVERY first
            testDrone.status = 'IN_DELIVERY';
            await testDrone.save();

            const order = await OrderModel.create({
                user: testUser._id,
                restaurant: testRestaurant._id,
                paymentId: testPayment._id,
                deliveryAddress: testAddress._id,
                orderItems: [
                    {
                        item: {
                            dishName: 'Test Dish',
                            price: 50
                        },
                        quantity: 2
                    }
                ],
                totalAmount: 100,
                orderStatus: 'shipping',
                drone: testDrone._id
            });

            const response = await request(app)
                .put(`/api/orders/updateOrderStatus/${order._id}`)
                .set('Cookie', [`token=${deliveryToken}`])
                .send({ orderStatus: 'delivered' });

            expect(response.status).toBe(200);
            expect(response.body.orderStatus).toBe('delivered');

            // Check drone status is updated
            const updatedDrone = await DroneModel.findById(testDrone._id);
            expect(updatedDrone.status).toBe('AVAILABLE');
        });

        it('should return 404 for non-existent order', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .put(`/api/orders/updateOrderStatus/${fakeId}`)
                .set('Cookie', [`token=${deliveryToken}`])
                .send({ orderStatus: 'delivered' });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Order not found');
        });
    });

    describe('PUT /api/orders/assignDrone/:id', () => {
        it('should assign drone to order successfully', async () => {
            const order = await OrderModel.create({
                user: testUser._id,
                restaurant: testRestaurant._id,
                paymentId: testPayment._id,
                deliveryAddress: testAddress._id,
                orderItems: [
                    {
                        item: {
                            dishName: 'Test Dish',
                            price: 50
                        },
                        quantity: 2
                    }
                ],
                totalAmount: 100,
                orderStatus: 'confirmed'
            });

            const response = await request(app)
                .put(`/api/orders/assignDrone/${order._id}`)
                .set('Cookie', [`token=${deliveryToken}`])
                .send({ droneId: testDrone._id });

            expect(response.status).toBe(200);
            expect(response.body.drone.toString()).toBe(testDrone._id.toString());

            // Check drone status is updated to IN_DELIVERY
            const updatedDrone = await DroneModel.findById(testDrone._id);
            expect(updatedDrone.status).toBe('IN_DELIVERY');
        });

        it('should return 404 for non-existent order', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .put(`/api/orders/assignDrone/${fakeId}`)
                .set('Cookie', [`token=${deliveryToken}`])
                .send({ droneId: testDrone._id });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Order not found');
        });

        it('should fail without authentication', async () => {
            const order = await OrderModel.create({
                user: testUser._id,
                restaurant: testRestaurant._id,
                paymentId: testPayment._id,
                deliveryAddress: testAddress._id,
                orderItems: [],
                totalAmount: 100
            });

            const response = await request(app)
                .put(`/api/orders/assignDrone/${order._id}`)
                .send({ droneId: testDrone._id });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/orders/getOrdersByResId/:id', () => {
        it('should get orders by restaurant ID', async () => {
            await OrderModel.create({
                user: testUser._id,
                restaurant: testRestaurant._id,
                paymentId: testPayment._id,
                deliveryAddress: testAddress._id,
                orderItems: [
                    {
                        item: {
                            dishName: 'Test Dish',
                            price: 50
                        },
                        quantity: 2
                    }
                ],
                totalAmount: 100
            });

            const response = await request(app)
                .get(`/api/orders/getOrdersByResId/${testRestaurant._id}`)
                .set('Cookie', [`token=${restaurantToken}`]);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
            expect(response.body[0].restaurant).toBe(testRestaurant._id.toString());
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .get(`/api/orders/getOrdersByResId/${testRestaurant._id}`);

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/orders/getAllDeliveredOrders', () => {
        it('should get all delivered orders', async () => {
            // Create unique payment for first order
            const payment1 = await PaymentModel.create({
                orderId: 'ORDER_DELIVERED_1',
                amount: 100,
                status: 'completed'
            });

            await OrderModel.create({
                user: testUser._id,
                restaurant: testRestaurant._id,
                paymentId: payment1._id,
                deliveryAddress: testAddress._id,
                orderItems: [
                    {
                        item: {
                            dishName: 'Test Dish',
                            price: 50
                        },
                        quantity: 2
                    }
                ],
                totalAmount: 100,
                orderStatus: 'delivered'
            });

            // Create unique payment for second order
            const payment2 = await PaymentModel.create({
                orderId: 'ORDER_PENDING_1',
                amount: 60,
                status: 'completed'
            });

            await OrderModel.create({
                user: testUser._id,
                restaurant: testRestaurant._id,
                paymentId: payment2._id,
                deliveryAddress: testAddress._id,
                orderItems: [
                    {
                        item: {
                            dishName: 'Test Dish 2',
                            price: 60
                        },
                        quantity: 1
                    }
                ],
                totalAmount: 60,
                orderStatus: 'pending'
            });

            const response = await request(app)
                .get('/api/orders/getAllDeliveredOrders')
                .set('Cookie', [`token=${deliveryToken}`]);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
            expect(response.body[0].orderStatus).toBe('delivered');
        });
    });

    describe('GET /api/orders/getAllOrders', () => {
        it('should get all ready orders without assigned drone', async () => {
            // Create unique payment for first order
            const payment3 = await PaymentModel.create({
                orderId: 'ORDER_READY_1',
                amount: 100,
                status: 'completed'
            });

            await OrderModel.create({
                user: testUser._id,
                restaurant: testRestaurant._id,
                paymentId: payment3._id,
                deliveryAddress: testAddress._id,
                orderItems: [
                    {
                        item: {
                            dishName: 'Test Dish',
                            price: 50
                        },
                        quantity: 2
                    }
                ],
                totalAmount: 100,
                orderStatus: 'ready',  // Changed to 'ready' - getAllOrders only returns ready orders
                drone: null
            });

            // Create unique payment for second order
            const payment4 = await PaymentModel.create({
                orderId: 'ORDER_READY_2',
                amount: 60,
                status: 'completed'
            });

            await OrderModel.create({
                user: testUser._id,
                restaurant: testRestaurant._id,
                paymentId: payment4._id,
                deliveryAddress: testAddress._id,
                orderItems: [
                    {
                        item: {
                            dishName: 'Test Dish 2',
                            price: 60
                        },
                        quantity: 1
                    }
                ],
                totalAmount: 60,
                orderStatus: 'ready',  // Changed to 'ready'
                drone: testDrone._id
            });

            const response = await request(app)
                .get('/api/orders/getAllOrders')
                .set('Cookie', [`token=${deliveryToken}`]);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);  // Only returns the order without drone
            expect(response.body[0].drone).toBeUndefined();
        });
    });

    describe('GET /api/orders/getAllAcceptedOrders', () => {
        it('should get all orders assigned to drones', async () => {
            // Create unique payment for first order
            const payment5 = await PaymentModel.create({
                orderId: 'ORDER_SHIPPING_1',
                amount: 100,
                status: 'completed'
            });

            await OrderModel.create({
                user: testUser._id,
                restaurant: testRestaurant._id,
                paymentId: payment5._id,
                deliveryAddress: testAddress._id,
                orderItems: [
                    {
                        item: {
                            dishName: 'Test Dish',
                            price: 50
                        },
                        quantity: 2
                    }
                ],
                totalAmount: 100,
                orderStatus: 'shipping',
                drone: testDrone._id
            });

            // Create unique payment for second order
            const payment6 = await PaymentModel.create({
                orderId: 'ORDER_READY_3',
                amount: 60,
                status: 'completed'
            });

            await OrderModel.create({
                user: testUser._id,
                restaurant: testRestaurant._id,
                paymentId: payment6._id,
                deliveryAddress: testAddress._id,
                orderItems: [
                    {
                        item: {
                            dishName: 'Test Dish 2',
                            price: 60
                        },
                        quantity: 1
                    }
                ],
                totalAmount: 60,
                orderStatus: 'confirmed',
                drone: null
            });

            const response = await request(app)
                .get('/api/orders/getAllAcceptedOrders')
                .set('Cookie', [`token=${deliveryToken}`]);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
        });
    });

    describe('GET /api/orders/getOrdersByDroneId/:id', () => {
        it('should get orders assigned to a specific drone', async () => {
            await OrderModel.create({
                user: testUser._id,
                restaurant: testRestaurant._id,
                paymentId: testPayment._id,
                deliveryAddress: testAddress._id,
                orderItems: [
                    {
                        item: {
                            dishName: 'Test Dish',
                            price: 50
                        },
                        quantity: 2
                    }
                ],
                totalAmount: 100,
                drone: testDrone._id
            });

            const response = await request(app)
                .get(`/api/orders/getOrdersByDroneId/${testDrone._id}`)
                .set('Cookie', [`token=${deliveryToken}`]);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
        });

        it('should return empty array when drone has no orders', async () => {
            const response = await request(app)
                .get(`/api/orders/getOrdersByDroneId/${testDrone._id}`)
                .set('Cookie', [`token=${deliveryToken}`]);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });
    });

    describe('GET /api/orders/getOrdersByUserId', () => {
        it('should get orders by user ID', async () => {
            await OrderModel.create({
                user: testUser._id,
                restaurant: testRestaurant._id,
                paymentId: testPayment._id,
                deliveryAddress: testAddress._id,
                orderItems: [
                    {
                        item: {
                            dishName: 'Test Dish',
                            price: 50
                        },
                        quantity: 2
                    }
                ],
                totalAmount: 100
            });

            const response = await request(app)
                .get('/api/orders/getOrdersByUserId')
                .set('Cookie', [`token=${userToken}`]);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .get('/api/orders/getOrdersByUserId');

            expect(response.status).toBe(401);
        });
    });

    describe('Edge Cases', () => {
        it('should handle multiple order items correctly', async () => {
            const orderData = {
                restaurant: testRestaurant._id,
                paymentId: testPayment._id,
                deliveryAddress: testAddress._id,
                orderItems: [
                    {
                        item: {
                            dishName: 'Dish 1',
                            price: 30
                        },
                        quantity: 2
                    },
                    {
                        item: {
                            dishName: 'Dish 2',
                            price: 40
                        },
                        quantity: 1
                    }
                ],
                totalAmount: 100
            };

            const response = await request(app)
                .post('/api/orders/newOrder')
                .set('Cookie', [`token=${userToken}`])
                .send(orderData);

            expect(response.status).toBe(200);
            expect(response.body.orderItems.length).toBe(2);
        });

        it('should handle order status transitions correctly', async () => {
            const order = await OrderModel.create({
                user: testUser._id,
                restaurant: testRestaurant._id,
                paymentId: testPayment._id,
                deliveryAddress: testAddress._id,
                orderItems: [
                    {
                        item: {
                            dishName: 'Test Dish',
                            price: 50
                        },
                        quantity: 2
                    }
                ],
                totalAmount: 100,
                orderStatus: 'pending'
            });

            // Update to confirmed
            let response = await request(app)
                .put(`/api/orders/updateOrder/${order._id}`)
                .set('Cookie', [`token=${restaurantToken}`])
                .send({ orderStatus: 'confirmed' });
            expect(response.body.orderStatus).toBe('confirmed');

            // Update to shipping
            response = await request(app)
                .put(`/api/orders/updateOrderStatus/${order._id}`)
                .set('Cookie', [`token=${deliveryToken}`])
                .send({ orderStatus: 'shipping' });
            expect(response.body.orderStatus).toBe('shipping');

            // Update to delivered
            response = await request(app)
                .put(`/api/orders/updateOrderStatus/${order._id}`)
                .set('Cookie', [`token=${deliveryToken}`])
                .send({ orderStatus: 'delivered' });
            expect(response.body.orderStatus).toBe('delivered');
        });
    });
});


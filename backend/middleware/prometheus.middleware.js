import promClient from 'prom-client';

// Tạo Registry để quản lý metrics
const register = new promClient.Registry();

// Thêm default metrics (CPU, Memory, etc.)
promClient.collectDefaultMetrics({
    register,
    prefix: 'foodfast_backend_'
});

// Custom Metrics cho Backend

// 1. HTTP Request Duration Histogram
const httpRequestDuration = new promClient.Histogram({
    name: 'foodfast_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

// 2. HTTP Request Counter
const httpRequestTotal = new promClient.Counter({
    name: 'foodfast_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

// 3. Active Requests Gauge
const activeRequests = new promClient.Gauge({
    name: 'foodfast_active_requests',
    help: 'Number of active requests being processed'
});

// 4. Order Metrics
const ordersTotal = new promClient.Counter({
    name: 'foodfast_orders_total',
    help: 'Total number of orders created',
    labelNames: ['status']
});

const ordersValue = new promClient.Counter({
    name: 'foodfast_orders_value_total',
    help: 'Total value of orders',
    labelNames: ['status']
});

// 5. Payment Metrics
const paymentsTotal = new promClient.Counter({
    name: 'foodfast_payments_total',
    help: 'Total number of payments',
    labelNames: ['status', 'method']
});

const paymentsValue = new promClient.Counter({
    name: 'foodfast_payments_value_total',
    help: 'Total payment value',
    labelNames: ['status', 'method']
});

// 6. User Metrics
const usersTotal = new promClient.Counter({
    name: 'foodfast_users_total',
    help: 'Total number of registered users',
    labelNames: ['role']
});

// 7. Database Connection Status
const dbConnectionStatus = new promClient.Gauge({
    name: 'foodfast_db_connection_status',
    help: 'MongoDB connection status (1 = connected, 0 = disconnected)'
});

// 8. Drone Metrics
const dronesActive = new promClient.Gauge({
    name: 'foodfast_drones_active',
    help: 'Number of active drones'
});

const droneDeliveries = new promClient.Counter({
    name: 'foodfast_drone_deliveries_total',
    help: 'Total number of drone deliveries',
    labelNames: ['status']
});

// 9. API Errors
const apiErrors = new promClient.Counter({
    name: 'foodfast_api_errors_total',
    help: 'Total number of API errors',
    labelNames: ['method', 'route', 'error_type']
});

// 10. Restaurant Metrics
const restaurantsTotal = new promClient.Counter({
    name: 'foodfast_restaurants_total',
    help: 'Total number of restaurants',
    labelNames: ['status']
});

// Register all custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeRequests);
register.registerMetric(ordersTotal);
register.registerMetric(ordersValue);
register.registerMetric(paymentsTotal);
register.registerMetric(paymentsValue);
register.registerMetric(usersTotal);
register.registerMetric(dbConnectionStatus);
register.registerMetric(dronesActive);
register.registerMetric(droneDeliveries);
register.registerMetric(apiErrors);
register.registerMetric(restaurantsTotal);

// Middleware để track HTTP requests
export const prometheusMiddleware = (req, res, next) => {
    // Bỏ qua metrics endpoint
    if (req.path === '/metrics') {
        return next();
    }

    const start = Date.now();
    activeRequests.inc();

    // Override res.end để capture response
    const originalEnd = res.end;
    res.end = function(...args) {
        const duration = (Date.now() - start) / 1000;
        const route = req.route ? req.route.path : req.path;

        // Record metrics
        httpRequestDuration.observe(
            { method: req.method, route, status_code: res.statusCode },
            duration
        );

        httpRequestTotal.inc({
            method: req.method,
            route,
            status_code: res.statusCode
        });

        // Track errors
        if (res.statusCode >= 400) {
            apiErrors.inc({
                method: req.method,
                route,
                error_type: res.statusCode >= 500 ? 'server_error' : 'client_error'
            });
        }

        activeRequests.dec();
        originalEnd.apply(res, args);
    };

    next();
};

// Functions để update custom metrics từ controllers
export const metrics = {
    // Initialize metrics with 0 values to make them visible in Prometheus
    initialize: () => {
        console.log('🔧 Initializing Prometheus metrics...');
        // Initialize order metrics with 0
        ordersTotal.inc({ status: 'pending' }, 0);
        ordersTotal.inc({ status: 'confirmed' }, 0);
        ordersTotal.inc({ status: 'preparing' }, 0);
        ordersTotal.inc({ status: 'shipping' }, 0);
        ordersTotal.inc({ status: 'delivered' }, 0);
        ordersTotal.inc({ status: 'cancelled' }, 0);

        ordersValue.inc({ status: 'pending' }, 0);
        ordersValue.inc({ status: 'confirmed' }, 0);
        ordersValue.inc({ status: 'preparing' }, 0);
        ordersValue.inc({ status: 'shipping' }, 0);
        ordersValue.inc({ status: 'delivered' }, 0);
        ordersValue.inc({ status: 'cancelled' }, 0);

        // Initialize payment metrics with 0
        paymentsTotal.inc({ status: 'created', method: 'razorpay' }, 0);
        paymentsTotal.inc({ status: 'paid', method: 'razorpay' }, 0);
        paymentsTotal.inc({ status: 'failed', method: 'razorpay' }, 0);
        paymentsTotal.inc({ status: 'created', method: 'vnpay' }, 0);
        paymentsTotal.inc({ status: 'success', method: 'vnpay' }, 0);
        paymentsTotal.inc({ status: 'failed', method: 'vnpay' }, 0);

        paymentsValue.inc({ status: 'created', method: 'razorpay' }, 0);
        paymentsValue.inc({ status: 'paid', method: 'razorpay' }, 0);
        paymentsValue.inc({ status: 'failed', method: 'razorpay' }, 0);
        paymentsValue.inc({ status: 'created', method: 'vnpay' }, 0);
        paymentsValue.inc({ status: 'success', method: 'vnpay' }, 0);
        paymentsValue.inc({ status: 'failed', method: 'vnpay' }, 0);

        // Initialize user metrics with 0
        usersTotal.inc({ role: 'customer' }, 0);
        usersTotal.inc({ role: 'restaurant' }, 0);
        usersTotal.inc({ role: 'delivery' }, 0);
        usersTotal.inc({ role: 'admin' }, 0);

        console.log('✅ Prometheus metrics initialized');
    },

    // Load existing data from database and populate metrics
    loadExistingData: async () => {
        try {
            console.log('📊 Loading existing data from database to populate metrics...');

            // Dynamically import models to avoid circular dependencies
            const { default: OrderModel } = await import('../models/OrderModel.js');
            const { default: PaymentModel } = await import('../models/PaymentModel.js');
            const { default: UserModel } = await import('../models/UserModel.js');

            // Validate models are loaded
            if (!OrderModel) {
                console.error('⚠️ OrderModel is undefined, skipping order metrics');
                return;
            }
            if (!PaymentModel) {
                console.error('⚠️ PaymentModel is undefined, skipping payment metrics');
                return;
            }
            if (!UserModel) {
                console.error('⚠️ UserModel is undefined, skipping user metrics');
                return;
            }

            // Load and count orders by status
            const orders = await OrderModel.find({});
            const ordersByStatus = orders.reduce((acc, order) => {
                const status = order.orderStatus || 'pending';
                if (!acc[status]) acc[status] = { count: 0, value: 0 };
                acc[status].count++;
                acc[status].value += order.totalAmount || 0;
                return acc;
            }, {});

            // Update order metrics with actual counts
            for (const [status, data] of Object.entries(ordersByStatus)) {
                ordersTotal.inc({ status }, data.count);
                ordersValue.inc({ status }, data.value);
                console.log(`  📦 Loaded ${data.count} orders with status "${status}" (total value: $${data.value})`);
            }

            // Load and count payments by status and method
            const payments = await PaymentModel.find({});
            const paymentsByStatusMethod = payments.reduce((acc, payment) => {
                const status = payment.payStatus || 'created';
                const method = payment.paymentMethod?.toLowerCase() || 'unknown';
                const key = `${status}_${method}`;
                if (!acc[key]) acc[key] = { status, method, count: 0, value: 0 };
                acc[key].count++;
                acc[key].value += payment.amount || 0;
                return acc;
            }, {});

            // Update payment metrics with actual counts
            for (const data of Object.values(paymentsByStatusMethod)) {
                paymentsTotal.inc({ status: data.status, method: data.method }, data.count);
                paymentsValue.inc({ status: data.status, method: data.method }, data.value);
                console.log(`  💳 Loaded ${data.count} ${data.method} payments with status "${data.status}" (total value: $${data.value})`);
            }

            // Load and count users
            const users = await UserModel.find({});
            usersTotal.inc({ role: 'customer' }, users.length);
            console.log(`  👥 Loaded ${users.length} users`);

            // Load and count active drones
            try {
                const { default: DroneModel } = await import('../models/DroneModel.js');
                const drones = await DroneModel.find({});
                const activeDrones = drones.filter(drone =>
                    drone.status === 'AVAILABLE' || drone.status === 'IN_DELIVERY'
                );
                dronesActive.set(activeDrones.length);
                console.log(`  🚁 Loaded ${activeDrones.length} active drones (out of ${drones.length} total)`);
            } catch (droneError) {
                console.error('  ⚠️ Could not load drones:', droneError.message);
                dronesActive.set(0);
            }

            console.log('✅ Successfully loaded existing data into metrics');
        } catch (error) {
            console.error('❌ Error loading existing data into metrics:', error);
        }
    },

    recordOrder: (status, value) => {
        console.log(`📊 Recording order metric: status=${status}, value=${value}`);
        ordersTotal.inc({ status });
        if (value) {
            ordersValue.inc({ status }, value);
        }
        console.log(`✅ Order metric recorded successfully`);
    },

    recordPayment: (status, method, value) => {
        console.log(`📊 Recording payment metric: status=${status}, method=${method}, value=${value}`);
        paymentsTotal.inc({ status, method });
        if (value) {
            paymentsValue.inc({ status, method }, value);
        }
        console.log(`✅ Payment metric recorded successfully`);
    },

    recordUser: (role) => {
        console.log(`📊 Recording user metric: role=${role}`);
        usersTotal.inc({ role });
        console.log(`✅ User metric recorded successfully`);
    },

    setDbStatus: (connected) => {
        dbConnectionStatus.set(connected ? 1 : 0);
    },

    setActiveDrones: (count) => {
        dronesActive.set(count);
    },

    recordDroneDelivery: (status) => {
        droneDeliveries.inc({ status });
    },

    recordRestaurant: (status) => {
        restaurantsTotal.inc({ status });
    }
};

// Export register để expose metrics endpoint
export { register };

// Endpoint handler cho /metrics
export const metricsHandler = async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    const metricsData = await register.metrics();
    res.send(metricsData);
};

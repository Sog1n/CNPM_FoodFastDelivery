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
    recordOrder: (status, value) => {
        ordersTotal.inc({ status });
        if (value) {
            ordersValue.inc({ status }, value);
        }
    },

    recordPayment: (status, method, value) => {
        paymentsTotal.inc({ status, method });
        if (value) {
            paymentsValue.inc({ status, method }, value);
        }
    },

    recordUser: (role) => {
        usersTotal.inc({ role });
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


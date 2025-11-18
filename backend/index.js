import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import { createProxyMiddleware } from 'http-proxy-middleware';
import cookieParser from "cookie-parser";
import ResRouter from "./routes/ResRoutes.js";
import UserRoutes from './routes/UserRoutes.js';
import DelRoutes from './routes/DelRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import paymentRouter from './routes/paymentRoutes.js';
import addressRoutes from './routes/AddressRoutes.js';
import orderRoutes from './routes/OrderRoutes.js';
import MapAddressRoutes from './routes/MapAddressRoutes.js'
import DroneRoutes from "./routes/DroneRoutes.js";
import { prometheusMiddleware, metricsHandler, metrics } from './middleware/prometheus.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Prometheus middleware - đặt trước CORS
app.use(prometheusMiddleware);

// CORS configuration cho production
const allowedOrigins = [
    "https://cnpm-food-fast-delivery.vercel.app",
    "http://localhost:5173", // cho local development
    "http://localhost:3000"
];

app.get('/', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Metrics endpoint cho Prometheus
app.get('/metrics', metricsHandler);

// CORS configuration cho production
app.use(cors({
    origin: function (origin, callback) {
        // Cho phép requests không có origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        // Kiểm tra origin
        const isVercelDomain = origin.includes('vercel.app');
        const isLocalhost = origin.includes('localhost');
        const isAllowedDomain = origin === 'https://cnpm-food-fast-delivery.vercel.app';

        if (isVercelDomain || isLocalhost || isAllowedDomain) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(cookieParser());

// Health check endpoint cho Railway


// Proxy setup
app.use('/api/nominatim', createProxyMiddleware({
    target: 'https://nominatim.openstreetmap.org',
    changeOrigin: true,
    pathRewrite: { '^/api/nominatim': '' },
    onProxyRes: (proxyRes) => {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    }
}));

// Routes
app.use('/api/addresses', MapAddressRoutes);
app.use('/auth', ResRouter);
app.use('/auth', UserRoutes);
app.use('/auth', DelRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/payment', paymentRouter);
app.use('/api/addresses', addressRoutes);
app.use('/api/order', orderRoutes);
app.use("/api/drones", DroneRoutes);

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log("MongoDB connected");
        metrics.setDbStatus(true); // Track DB connection status
        metrics.initialize(); // Initialize all metrics with 0 values
        await metrics.loadExistingData(); // Load existing data from database
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
        metrics.setDbStatus(false); // Track DB connection failure
    });

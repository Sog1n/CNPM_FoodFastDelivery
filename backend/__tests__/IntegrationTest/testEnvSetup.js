// Ensure critical env vars are set for tests (used on CI)
process.env.KEY = process.env.KEY || 'test-key-for-integration';
process.env.RAILWAY_ENVIRONMENT_NAME = process.env.RAILWAY_ENVIRONMENT_NAME || 'development';
// Other defaults used in app
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';


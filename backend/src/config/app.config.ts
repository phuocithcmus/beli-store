import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    retentionDays: parseInt(process.env.LOG_RETENTION_DAYS, 10) || 7,
  },
  security: {
    helmetEnabled: process.env.HELMET_ENABLED === 'true',
    trustProxy: process.env.TRUST_PROXY === 'true',
  },
}));

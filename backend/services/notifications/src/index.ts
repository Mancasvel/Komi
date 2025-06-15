import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import notificationRoutes from './routes/notifications'
import pushRoutes from './routes/push'

const app = express()
const PORT = process.env.NOTIFICATIONS_SERVICE_PORT || 3007

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '500'), // Higher limit for notifications
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000 / 60)
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(compression())
app.use(limiter)
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '5mb' }))

// Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined
  })
  next()
})

// Routes
app.use('/api/notifications', notificationRoutes)
app.use('/api/push', pushRoutes)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'notifications',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Komi Notifications Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      notifications: '/api/notifications',
      push: '/api/push',
      health: '/health'
    },
    features: [
      'Multi-channel notifications',
      'Push notifications',
      'Email notifications',
      'SMS notifications',
      'Template system',
      'Notification analytics'
    ]
  })
})

// Error handling
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  })
})

// Start server
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      logger.info(`🔔 Notifications Service running on port ${PORT}`, {
        port: PORT,
        env: process.env.NODE_ENV,
        service: 'notifications'
      })
    })
  } catch (error) {
    logger.error('Failed to start server', { error, service: 'notifications' })
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully')
  process.exit(0)
})

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully')
  process.exit(0)
})

startServer() 
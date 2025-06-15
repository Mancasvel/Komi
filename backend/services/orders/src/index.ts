import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import orderRoutes from './routes/orders'
import cartRoutes from './routes/cart'

const app = express()
const PORT = process.env.ORDERS_SERVICE_PORT || 3005

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200'), // Higher limit for orders
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
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

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
app.use('/api/orders', orderRoutes)
app.use('/api/cart', cartRoutes)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'orders',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Komi Orders Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      orders: '/api/orders',
      cart: '/api/cart',
      health: '/health'
    },
    features: [
      'Order management',
      'Cart functionality',
      'Order tracking',
      'Payment processing',
      'Status updates'
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
      logger.info(`🛒 Orders Service running on port ${PORT}`, {
        port: PORT,
        env: process.env.NODE_ENV,
        service: 'orders'
      })
    })
  } catch (error) {
    logger.error('Failed to start server', { error, service: 'orders' })
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
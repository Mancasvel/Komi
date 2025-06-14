import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import { authenticateToken } from './middleware/auth'
import { validateRequest } from './middleware/validation'
import { healthRoutes } from './routes/health'
import { authRoutes } from './routes/auth'

// Cargar variables de entorno
dotenv.config()

const app = express()
const PORT = process.env.API_GATEWAY_PORT || 3001

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // límite de 100 peticiones por ventana
  message: {
    error: 'Demasiadas peticiones desde esta IP, inténtalo de nuevo más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Middlewares de seguridad y utilidades
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(compression())
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(limiter)

// Rutas directas del gateway
app.use('/health', healthRoutes)
app.use('/auth', authRoutes)

// Configuración de proxies a microservicios
const services = {
  nlp: {
    target: `http://${process.env.NLP_SERVICE_HOST || 'localhost'}:${process.env.NLP_SERVICE_PORT || 3002}`,
    pathRewrite: { '^/api/nlp': '' },
  },
  restaurants: {
    target: `http://${process.env.RESTAURANTS_SERVICE_HOST || 'localhost'}:${process.env.RESTAURANTS_SERVICE_PORT || 3003}`,
    pathRewrite: { '^/api/restaurants': '' },
  },
  users: {
    target: `http://${process.env.USERS_SERVICE_HOST || 'localhost'}:${process.env.USERS_SERVICE_PORT || 3004}`,
    pathRewrite: { '^/api/users': '' },
  },
  orders: {
    target: `http://${process.env.ORDERS_SERVICE_HOST || 'localhost'}:${process.env.ORDERS_SERVICE_PORT || 3005}`,
    pathRewrite: { '^/api/orders': '' },
  },
  recommender: {
    target: `http://${process.env.MENU_RECOMMENDER_HOST || 'localhost'}:${process.env.MENU_RECOMMENDER_PORT || 3006}`,
    pathRewrite: { '^/api/recommendations': '' },
  },
}

// Configurar proxies para cada microservicio
Object.entries(services).forEach(([serviceName, config]) => {
  const proxyOptions = {
    target: config.target,
    changeOrigin: true,
    pathRewrite: config.pathRewrite,
    onError: (err: Error, req: express.Request, res: express.Response) => {
      logger.error(`Proxy error for ${serviceName}:`, err)
      res.status(503).json({
        error: 'Service temporarily unavailable',
        service: serviceName
      })
    },
    onProxyReq: (proxyReq: any, req: express.Request) => {
      logger.info(`Proxying ${req.method} ${req.url} to ${serviceName}`)
    },
  }

  // Aplicar autenticación donde sea necesaria
  if (['users', 'orders'].includes(serviceName)) {
    app.use(`/api/${serviceName === 'recommender' ? 'recommendations' : serviceName}`, 
             authenticateToken, 
             createProxyMiddleware(proxyOptions))
  } else {
    app.use(`/api/${serviceName === 'recommender' ? 'recommendations' : serviceName}`, 
             createProxyMiddleware(proxyOptions))
  }
})

// Endpoint principal de búsqueda que combina NLP + Recomendador
app.post('/api/search', validateRequest, async (req, res, next) => {
  try {
    const { query, location, filters = {} } = req.body

    if (!query) {
      return res.status(400).json({ error: 'Query is required' })
    }

    logger.info(`Search request: "${query}" with filters:`, filters)

    // 1. Procesar lenguaje natural
    const nlpResponse = await fetch(`${services.nlp.target}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: query })
    })

    if (!nlpResponse.ok) {
      throw new Error('NLP service unavailable')
    }

    const nlpResult = await nlpResponse.json()
    logger.info('NLP analysis result:', nlpResult)

    // 2. Obtener recomendaciones
    const recommendationsResponse = await fetch(`${services.recommender.target}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysis: nlpResult,
        location,
        filters: { ...filters, ...nlpResult.filters }
      })
    })

    if (!recommendationsResponse.ok) {
      throw new Error('Recommendation service unavailable')
    }

    const recommendations = await recommendationsResponse.json()

    res.json({
      query,
      analysis: nlpResult,
      recommendations: recommendations.items || [],
      metadata: {
        total: recommendations.total || 0,
        processingTime: Date.now() - req.startTime,
      }
    })

  } catch (error) {
    logger.error('Search endpoint error:', error)
    next(error)
  }
})

// Middleware de manejo de errores
app.use(errorHandler)

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  })
})

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`🚀 Komi API Gateway running on port ${PORT}`)
  logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
  
  // Log de servicios configurados
  Object.entries(services).forEach(([name, config]) => {
    logger.info(`🔗 ${name} service: ${config.target}`)
  })
})

export default app 
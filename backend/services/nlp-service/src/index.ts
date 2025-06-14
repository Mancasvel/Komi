import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { nlpRoutes } from './routes/nlp'
import { healthRoutes } from './routes/health'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'

// Cargar variables de entorno
dotenv.config()

const app = express()
const PORT = process.env.NLP_SERVICE_PORT || 3002

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 peticiones por ventana
  message: {
    error: 'Demasiadas peticiones de análisis NLP, inténtalo de nuevo más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Middlewares
app.use(helmet())
app.use(cors())
app.use(compression())
app.use(morgan('combined', { 
  stream: { write: (message) => logger.info(message.trim()) } 
}))
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '5mb' }))
app.use(limiter)

// Middleware para agregar tiempo de inicio a la request
app.use((req: any, res, next) => {
  req.startTime = Date.now()
  next()
})

// Rutas
app.use('/health', healthRoutes)
app.use('/', nlpRoutes)

// Middleware de manejo de errores
app.use(errorHandler)

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    service: 'nlp-service',
    timestamp: new Date().toISOString()
  })
})

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`🧠 Komi NLP Service running on port ${PORT}`)
  logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
  logger.info(`🔑 OpenRouter configured: ${!!process.env.OPENROUTER_API_KEY}`)
})

export default app 
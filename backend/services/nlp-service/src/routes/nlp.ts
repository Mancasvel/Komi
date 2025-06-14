import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { NLPController } from '../controllers/nlpController'
import { logger } from '../utils/logger'
import NodeCache from 'node-cache'

const router = Router()
const nlpController = new NLPController()

// Cache para resultados de análisis (TTL: 1 hora)
const cache = new NodeCache({ stdTTL: 3600 })

// Middleware de validación
const validateAnalyzeRequest = [
  body('text')
    .isString()
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('El texto debe tener entre 3 y 500 caracteres'),
  
  body('language')
    .optional()
    .isString()
    .isIn(['es', 'en', 'auto'])
    .withMessage('El idioma debe ser "es", "en" o "auto"'),
    
  body('includeNutrition')
    .optional()
    .isBoolean()
    .withMessage('includeNutrition debe ser un booleano')
]

// Middleware para verificar errores de validación
const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array(),
      timestamp: new Date().toISOString()
    })
  }
  next()
}

/**
 * POST /analyze
 * Analiza texto en lenguaje natural para extraer intención alimentaria
 */
router.post('/analyze', validateAnalyzeRequest, handleValidationErrors, async (req, res, next) => {
  try {
    const { text, language = 'es', includeNutrition = false } = req.body
    const startTime = Date.now()

    // Verificar cache
    const cacheKey = `analyze:${text}:${language}:${includeNutrition}`
    const cachedResult = cache.get(cacheKey)
    
    if (cachedResult) {
      logger.info(`Cache hit for analysis: "${text.substring(0, 50)}..."`)
      return res.json({
        ...cachedResult,
        cached: true,
        processingTime: Date.now() - startTime
      })
    }

    logger.info(`Analyzing text: "${text.substring(0, 100)}..."`)

    const analysis = await nlpController.analyzeText(text, language, includeNutrition)
    
    // Guardar en cache
    cache.set(cacheKey, analysis)

    res.json({
      ...analysis,
      cached: false,
      processingTime: Date.now() - startTime
    })

  } catch (error) {
    logger.error('Error in /analyze endpoint:', error)
    next(error)
  }
})

/**
 * POST /extract-entities
 * Extrae entidades específicas del texto (ingredientes, restricciones, etc.)
 */
router.post('/extract-entities', 
  body('text').isString().trim().isLength({ min: 1, max: 500 }),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { text } = req.body
      
      logger.info(`Extracting entities from: "${text.substring(0, 50)}..."`)
      
      const entities = await nlpController.extractEntities(text)
      
      res.json({
        text,
        entities,
        processingTime: Date.now() - req.startTime
      })

    } catch (error) {
      logger.error('Error in /extract-entities endpoint:', error)
      next(error)
    }
  }
)

/**
 * POST /classify-intent
 * Clasifica la intención del usuario (buscar, ordenar, consultar, etc.)
 */
router.post('/classify-intent',
  body('text').isString().trim().isLength({ min: 1, max: 500 }),
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { text } = req.body
      
      logger.info(`Classifying intent for: "${text.substring(0, 50)}..."`)
      
      const intent = await nlpController.classifyIntent(text)
      
      res.json({
        text,
        intent,
        processingTime: Date.now() - req.startTime
      })

    } catch (error) {
      logger.error('Error in /classify-intent endpoint:', error)
      next(error)
    }
  }
)

/**
 * GET /supported-cuisines
 * Obtiene lista de cocinas/tipos de comida soportados
 */
router.get('/supported-cuisines', (req, res) => {
  const cuisines = nlpController.getSupportedCuisines()
  res.json({
    cuisines,
    total: cuisines.length
  })
})

/**
 * GET /dietary-restrictions
 * Obtiene lista de restricciones dietéticas reconocidas  
 */
router.get('/dietary-restrictions', (req, res) => {
  const restrictions = nlpController.getDietaryRestrictions()
  res.json({
    restrictions,
    total: restrictions.length
  })
})

/**
 * DELETE /cache
 * Limpia el cache del servicio (solo en desarrollo)
 */
router.delete('/cache', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Cache clearing only available in development'
    })
  }
  
  cache.flushAll()
  logger.info('NLP service cache cleared')
  
  res.json({
    message: 'Cache cleared successfully',
    timestamp: new Date().toISOString()
  })
})

/**
 * GET /stats
 * Estadísticas del servicio
 */
router.get('/stats', (req, res) => {
  const stats = cache.getStats()
  
  res.json({
    service: 'nlp-service',
    cache: {
      keys: cache.keys().length,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})

export { router as nlpRoutes } 
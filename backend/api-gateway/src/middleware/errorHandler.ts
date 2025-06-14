import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log del error
  logger.error('Error handled by errorHandler:', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  // Configurar código de estado por defecto
  const statusCode = err.statusCode || 500

  // Configurar mensaje de error
  let message = err.message

  // En producción, no mostrar detalles de errores del servidor
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal Server Error'
  }

  // Errores específicos
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      timestamp: new Date().toISOString()
    })
  }

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
      timestamp: new Date().toISOString()
    })
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid resource ID',
      timestamp: new Date().toISOString()
    })
  }

  // Respuesta de error genérica
  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal Server Error' : 'Client Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  })
}

// Crear errores personalizados
export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError
  error.statusCode = statusCode
  error.isOperational = true
  return error
}

// Wrapper para manejo de errores async
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// Manejo de promesas no capturadas
process.on('unhandledRejection', (reason: Error, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason: reason.message,
    stack: reason.stack
  })
})

// Manejo de excepciones no capturadas
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack
  })
  
  // Dar tiempo para que los logs se escriban antes de salir
  setTimeout(() => {
    process.exit(1)
  }, 1000)
}) 
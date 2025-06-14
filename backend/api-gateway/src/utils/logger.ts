import winston from 'winston'

const isDevelopment = process.env.NODE_ENV === 'development'

// Configuración de formato personalizado
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`
    
    // Añadir metadata si existe
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`
    }
    
    // Añadir stack trace en errores
    if (stack) {
      log += `\n${stack}`
    }
    
    return log
  })
)

// Configuración de transportes
const transports: winston.transport[] = [
  // Console transport (siempre activo)
  new winston.transports.Console({
    level: isDevelopment ? 'debug' : 'info',
    format: winston.format.combine(
      winston.format.colorize(),
      customFormat
    )
  })
]

// File transports solo en producción
if (!isDevelopment) {
  transports.push(
    // Log de errores
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Log combinado
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  )
}

// Crear instancia del logger
export const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: customFormat,
  transports,
  // No salir en errores no capturados
  exitOnError: false
})

// Stream para Morgan
logger.stream = {
  write: (message: string) => {
    logger.info(message.trim())
  }
}

// Métodos de utilidad
export const logRequest = (req: any, res: any, responseTime: number) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    responseTime: `${responseTime}ms`,
    statusCode: res.statusCode
  })
}

export const logError = (error: Error, req?: any) => {
  const errorInfo: any = {
    message: error.message,
    stack: error.stack,
    name: error.name
  }
  
  if (req) {
    errorInfo.request = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  }
  
  logger.error('Application Error', errorInfo)
}

export default logger 
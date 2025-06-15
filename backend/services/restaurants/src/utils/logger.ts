import winston from 'winston'

const logLevel = process.env.LOG_LEVEL || 'info'

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
)

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'restaurants-service' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for production
    new winston.transports.File({
      filename: 'logs/restaurants-error.log',
      level: 'error',
      format: logFormat
    }),
    
    new winston.transports.File({
      filename: 'logs/restaurants-combined.log',
      format: logFormat
    })
  ]
})

// Handle uncaught exceptions
logger.exceptions.handle(
  new winston.transports.File({ filename: 'logs/restaurants-exceptions.log' })
)

// Handle unhandled promise rejections
logger.rejections.handle(
  new winston.transports.File({ filename: 'logs/restaurants-rejections.log' })
)

export default logger 
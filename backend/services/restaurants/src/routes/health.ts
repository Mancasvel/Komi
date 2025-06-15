import express from 'express'
import mongoose from 'mongoose'

const router = express.Router()

router.get('/', (req, res) => {
  const healthStatus = {
    service: 'Restaurants Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      name: mongoose.connection.name || 'unknown'
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
      unit: 'MB'
    }
  }

  res.status(200).json(healthStatus)
})

export default router 
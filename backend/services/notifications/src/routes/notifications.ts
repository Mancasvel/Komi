import { Router } from 'express'
import {
  sendNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  sendTemplateNotification,
  getNotificationStats
} from '../controllers/notificationController'

const router = Router()

// POST routes
router.post('/', sendNotification)
router.post('/template', sendTemplateNotification)
router.post('/:id/read', markAsRead)
router.post('/users/:userId/read-all', markAllAsRead)

// GET routes
router.get('/users/:userId', getUserNotifications)
router.get('/users/:userId/stats', getNotificationStats)

export default router 
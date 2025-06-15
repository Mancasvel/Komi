import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

// Interfaces
interface Notification {
  _id?: string
  userId: string
  title: string
  message: string
  type: 'order_update' | 'promotion' | 'system' | 'reminder'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  channels: ('email' | 'push' | 'sms')[]
  data?: any
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read'
  scheduledAt?: Date
  sentAt?: Date
  readAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

interface PushSubscription {
  userId: string
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  userAgent?: string
  isActive: boolean
  createdAt: Date
}

interface NotificationTemplate {
  id: string
  name: string
  type: string
  subject?: string
  htmlTemplate: string
  textTemplate: string
  variables: string[]
}

// Mock data for development
let notifications: Notification[] = [
  {
    _id: 'notif_1',
    userId: 'user123',
    title: 'Tu pedido está en camino',
    message: 'El pedido de Curry Palace está siendo preparado. Tiempo estimado: 25 minutos.',
    type: 'order_update',
    priority: 'high',
    channels: ['push', 'email'],
    data: {
      orderId: '1',
      restaurantName: 'Curry Palace',
      estimatedTime: 25
    },
    status: 'sent',
    sentAt: new Date(Date.now() - 5 * 60 * 1000),
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000)
  }
]

let pushSubscriptions: PushSubscription[] = []

const notificationTemplates: NotificationTemplate[] = [
  {
    id: 'order_confirmed',
    name: 'Pedido Confirmado',
    type: 'order_update',
    subject: 'Tu pedido ha sido confirmado - Komi',
    htmlTemplate: `
      <h2>¡Tu pedido ha sido confirmado!</h2>
      <p>Hola {{userName}},</p>
      <p>Tu pedido de <strong>{{restaurantName}}</strong> ha sido confirmado.</p>
      <p><strong>Tiempo estimado:</strong> {{estimatedTime}} minutos</p>
      <p><strong>Total:</strong> €{{total}}</p>
      <p>Te mantendremos informado del estado de tu pedido.</p>
    `,
    textTemplate: 'Tu pedido de {{restaurantName}} ha sido confirmado. Tiempo estimado: {{estimatedTime}} minutos. Total: €{{total}}',
    variables: ['userName', 'restaurantName', 'estimatedTime', 'total']
  },
  {
    id: 'order_on_route',
    name: 'Pedido en Camino',
    type: 'order_update',
    subject: 'Tu pedido está en camino - Komi',
    htmlTemplate: `
      <h2>¡Tu pedido está en camino!</h2>
      <p>Hola {{userName}},</p>
      <p>Tu pedido de <strong>{{restaurantName}}</strong> está siendo entregado.</p>
      <p><strong>Llegada estimada:</strong> {{deliveryTime}}</p>
      <p>Puedes rastrear tu pedido en tiempo real desde la app.</p>
    `,
    textTemplate: 'Tu pedido de {{restaurantName}} está en camino. Llegada estimada: {{deliveryTime}}',
    variables: ['userName', 'restaurantName', 'deliveryTime']
  }
]

// Helper functions
const generateNotificationId = (): string => {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const processTemplate = (template: string, variables: { [key: string]: any }): string => {
  let processed = template
  Object.keys(variables).forEach(key => {
    const value = variables[key]
    processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value)
  })
  return processed
}

// Mock send functions (in production, these would integrate with actual services)
const sendPushNotification = async (userId: string, title: string, message: string, data?: any): Promise<boolean> => {
  try {
    // Find user's push subscriptions
    const userSubscriptions = pushSubscriptions.filter(sub => sub.userId === userId && sub.isActive)
    
    if (userSubscriptions.length === 0) {
      logger.warn('No active push subscriptions found for user', { userId })
      return false
    }

    // In a real implementation, use web-push library
    logger.info('Push notification sent', { 
      userId, 
      title, 
      subscriptions: userSubscriptions.length 
    })
    
    return true
  } catch (error) {
    logger.error('Failed to send push notification', { error, userId })
    return false
  }
}

const sendEmailNotification = async (userId: string, subject: string, htmlContent: string, textContent: string): Promise<boolean> => {
  try {
    // In a real implementation, use nodemailer or email service
    logger.info('Email notification sent', { userId, subject })
    return true
  } catch (error) {
    logger.error('Failed to send email notification', { error, userId })
    return false
  }
}

const sendSMSNotification = async (userId: string, message: string): Promise<boolean> => {
  try {
    // In a real implementation, use Twilio or SMS service
    logger.info('SMS notification sent', { userId, messageLength: message.length })
    return true
  } catch (error) {
    logger.error('Failed to send SMS notification', { error, userId })
    return false
  }
}

// Controllers
export const sendNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      userId, 
      title, 
      message, 
      type = 'system', 
      priority = 'medium', 
      channels = ['push'], 
      data,
      scheduledAt 
    } = req.body

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'userId, title, and message are required'
      })
    }

    const notification: Notification = {
      _id: generateNotificationId(),
      userId,
      title,
      message,
      type,
      priority,
      channels,
      data,
      status: scheduledAt ? 'pending' : 'sent',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      sentAt: scheduledAt ? undefined : new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    notifications.push(notification)

    // Send immediately if not scheduled
    if (!scheduledAt) {
      const results = await sendNotificationToChannels(notification)
      
      // Update status based on results
      const notificationIndex = notifications.findIndex(n => n._id === notification._id)
      if (notificationIndex !== -1) {
        notifications[notificationIndex].status = results.some(r => r.success) ? 'sent' : 'failed'
        notifications[notificationIndex].updatedAt = new Date()
      }
    }

    logger.info('Notification created', { 
      notificationId: notification._id, 
      userId, 
      type, 
      channels,
      scheduled: !!scheduledAt
    })

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    })

  } catch (error) {
    logger.error('Error creating notification', { error })
    next(error)
  }
}

export const getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params
    const { status, type, page = 1, limit = 20, unreadOnly = 'false' } = req.query

    let userNotifications = notifications.filter(n => n.userId === userId)

    // Apply filters
    if (status) {
      userNotifications = userNotifications.filter(n => n.status === status)
    }

    if (type) {
      userNotifications = userNotifications.filter(n => n.type === type)
    }

    if (unreadOnly === 'true') {
      userNotifications = userNotifications.filter(n => !n.readAt)
    }

    // Sort by creation date (newest first)
    userNotifications.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())

    // Pagination
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const startIndex = (pageNum - 1) * limitNum
    const endIndex = startIndex + limitNum

    const paginatedNotifications = userNotifications.slice(startIndex, endIndex)

    // Count unread notifications
    const unreadCount = notifications.filter(n => n.userId === userId && !n.readAt).length

    logger.info('Retrieved user notifications', { 
      userId, 
      total: userNotifications.length, 
      unread: unreadCount,
      page: pageNum
    })

    res.json({
      success: true,
      data: paginatedNotifications,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(userNotifications.length / limitNum),
        totalNotifications: userNotifications.length,
        unreadCount,
        hasNext: endIndex < userNotifications.length,
        hasPrev: pageNum > 1
      }
    })

  } catch (error) {
    next(error)
  }
}

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { userId } = req.body

    const notificationIndex = notifications.findIndex(n => n._id === id)
    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      })
    }

    const notification = notifications[notificationIndex]

    // Check permission
    if (notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      })
    }

    // Mark as read
    notifications[notificationIndex].readAt = new Date()
    notifications[notificationIndex].updatedAt = new Date()

    logger.info('Notification marked as read', { notificationId: id, userId })

    res.json({
      success: true,
      data: notifications[notificationIndex],
      message: 'Notification marked as read'
    })

  } catch (error) {
    next(error)
  }
}

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params

    const updatedCount = notifications.filter(n => n.userId === userId && !n.readAt).length

    // Mark all unread notifications as read
    notifications.forEach((notification, index) => {
      if (notification.userId === userId && !notification.readAt) {
        notifications[index].readAt = new Date()
        notifications[index].updatedAt = new Date()
      }
    })

    logger.info('All notifications marked as read', { userId, count: updatedCount })

    res.json({
      success: true,
      message: `${updatedCount} notifications marked as read`
    })

  } catch (error) {
    next(error)
  }
}

export const subscribeToPush = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params
    const { endpoint, keys, userAgent } = req.body

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        success: false,
        error: 'endpoint and keys (p256dh, auth) are required'
      })
    }

    // Check if subscription already exists
    const existingIndex = pushSubscriptions.findIndex(
      sub => sub.userId === userId && sub.endpoint === endpoint
    )

    if (existingIndex !== -1) {
      // Update existing subscription
      pushSubscriptions[existingIndex] = {
        ...pushSubscriptions[existingIndex],
        keys,
        userAgent,
        isActive: true
      }

      logger.info('Push subscription updated', { userId, endpoint })

      res.json({
        success: true,
        message: 'Push subscription updated'
      })
    } else {
      // Create new subscription
      const subscription: PushSubscription = {
        userId,
        endpoint,
        keys,
        userAgent,
        isActive: true,
        createdAt: new Date()
      }

      pushSubscriptions.push(subscription)

      logger.info('Push subscription created', { userId, endpoint })

      res.status(201).json({
        success: true,
        message: 'Push subscription created'
      })
    }

  } catch (error) {
    next(error)
  }
}

export const unsubscribeFromPush = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params
    const { endpoint } = req.body

    const subscriptionIndex = pushSubscriptions.findIndex(
      sub => sub.userId === userId && sub.endpoint === endpoint
    )

    if (subscriptionIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      })
    }

    // Deactivate subscription
    pushSubscriptions[subscriptionIndex].isActive = false

    logger.info('Push subscription deactivated', { userId, endpoint })

    res.json({
      success: true,
      message: 'Push subscription deactivated'
    })

  } catch (error) {
    next(error)
  }
}

export const sendTemplateNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { templateId, userId, variables, channels = ['push', 'email'] } = req.body

    if (!templateId || !userId || !variables) {
      return res.status(400).json({
        success: false,
        error: 'templateId, userId, and variables are required'
      })
    }

    const template = notificationTemplates.find(t => t.id === templateId)
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      })
    }

    // Process template
    const title = template.subject ? processTemplate(template.subject, variables) : 'Notification'
    const message = processTemplate(template.textTemplate, variables)
    const htmlContent = processTemplate(template.htmlTemplate, variables)

    const notification: Notification = {
      _id: generateNotificationId(),
      userId,
      title,
      message,
      type: template.type as any,
      priority: 'medium',
      channels,
      data: { templateId, variables },
      status: 'sent',
      sentAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    notifications.push(notification)

    // Send notification
    await sendNotificationToChannels(notification)

    logger.info('Template notification sent', { 
      templateId, 
      userId, 
      channels,
      notificationId: notification._id
    })

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Template notification sent successfully'
    })

  } catch (error) {
    next(error)
  }
}

export const getNotificationStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params
    const { period = '7d' } = req.query

    // Calculate date range
    let startDate: Date
    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }

    const userNotifications = notifications.filter(n => 
      n.userId === userId && 
      new Date(n.createdAt!) >= startDate
    )

    const stats = {
      total: userNotifications.length,
      byType: userNotifications.reduce((acc: any, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1
        return acc
      }, {}),
      byStatus: userNotifications.reduce((acc: any, n) => {
        acc[n.status] = (acc[n.status] || 0) + 1
        return acc
      }, {}),
      unread: userNotifications.filter(n => !n.readAt).length,
      activePushSubscriptions: pushSubscriptions.filter(s => s.userId === userId && s.isActive).length
    }

    res.json({
      success: true,
      data: stats,
      period
    })

  } catch (error) {
    next(error)
  }
}

// Helper function to send notifications to multiple channels
const sendNotificationToChannels = async (notification: Notification): Promise<Array<{ channel: string; success: boolean }>> => {
  const results: Array<{ channel: string; success: boolean }> = []

  for (const channel of notification.channels) {
    try {
      let success = false

      switch (channel) {
        case 'push':
          success = await sendPushNotification(
            notification.userId, 
            notification.title, 
            notification.message, 
            notification.data
          )
          break
        case 'email':
          success = await sendEmailNotification(
            notification.userId, 
            notification.title, 
            notification.message, 
            notification.message
          )
          break
        case 'sms':
          success = await sendSMSNotification(notification.userId, notification.message)
          break
      }

      results.push({ channel, success })
    } catch (error) {
      logger.error(`Failed to send ${channel} notification`, { error, notificationId: notification._id })
      results.push({ channel, success: false })
    }
  }

  return results
} 
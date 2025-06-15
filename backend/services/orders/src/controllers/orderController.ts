import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

// Interfaces
interface OrderItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  specialInstructions?: string
  restaurant: {
    id: string
    name: string
  }
}

interface Order {
  _id?: string
  userId: string
  items: OrderItem[]
  restaurant: {
    id: string
    name: string
    address: string
    phone: string
  }
  delivery: {
    address: {
      street: string
      city: string
      zipCode: string
      coordinates?: [number, number]
    }
    instructions?: string
    estimatedTime: number
  }
  pricing: {
    subtotal: number
    deliveryFee: number
    tax: number
    total: number
  }
  payment: {
    method: 'card' | 'cash' | 'paypal'
    status: 'pending' | 'paid' | 'failed' | 'refunded'
    stripePaymentIntentId?: string
    transactionId?: string
  }
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'on_route' | 'delivered' | 'cancelled'
  tracking: {
    estimatedDelivery: Date
    updates: Array<{
      status: string
      timestamp: Date
      message: string
    }>
  }
  createdAt?: Date
  updatedAt?: Date
}

interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  restaurantId: string
  specialInstructions?: string
}

// Mock data for development
let orders: Order[] = [
  {
    _id: '1',
    userId: 'user123',
    items: [
      {
        menuItemId: '2',
        name: 'Curry de Garbanzos Sin Gluten',
        price: 14.90,
        quantity: 1,
        restaurant: {
          id: '3',
          name: 'Curry Palace'
        }
      }
    ],
    restaurant: {
      id: '3',
      name: 'Curry Palace',
      address: 'Calle Alcalá 78, Madrid',
      phone: '+34 91 555 1234'
    },
    delivery: {
      address: {
        street: 'Calle Mayor 15',
        city: 'Madrid',
        zipCode: '28013'
      },
      estimatedTime: 35
    },
    pricing: {
      subtotal: 14.90,
      deliveryFee: 2.0,
      tax: 1.69,
      total: 18.59
    },
    payment: {
      method: 'card',
      status: 'paid',
      stripePaymentIntentId: 'pi_test_123456',
      transactionId: 'txn_test_123456'
    },
    status: 'preparing',
    tracking: {
      estimatedDelivery: new Date(Date.now() + 35 * 60 * 1000),
      updates: [
        {
          status: 'confirmed',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          message: 'Pedido confirmado por el restaurante'
        },
        {
          status: 'preparing',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          message: 'El restaurante está preparando tu pedido'
        }
      ]
    },
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000)
  }
]

// User carts (in-memory for demo)
const userCarts: { [userId: string]: CartItem[] } = {}

// Helper functions
const calculatePricing = (items: OrderItem[], deliveryFee: number = 2.5) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.10 // 10% tax
  const total = subtotal + deliveryFee + tax
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100
  }
}

const generateOrderId = (): string => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}

// Controllers
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, items, restaurant, delivery, paymentMethod } = req.body

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'userId and items are required'
      })
    }

    if (!restaurant || !delivery) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant and delivery information are required'
      })
    }

    // Calculate pricing
    const pricing = calculatePricing(items, restaurant.deliveryFee || 2.5)

    // Create order
    const newOrder: Order = {
      _id: generateOrderId(),
      userId,
      items,
      restaurant,
      delivery: {
        ...delivery,
        estimatedTime: 30 + Math.floor(Math.random() * 30) // 30-60 minutes
      },
      pricing,
      payment: {
        method: paymentMethod || 'card',
        status: 'pending'
      },
      status: 'pending',
      tracking: {
        estimatedDelivery: new Date(Date.now() + delivery.estimatedTime * 60 * 1000),
        updates: [{
          status: 'pending',
          timestamp: new Date(),
          message: 'Pedido creado, esperando confirmación'
        }]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    orders.push(newOrder)

    // Clear user cart
    if (userCarts[userId]) {
      delete userCarts[userId]
    }

    logger.info('Order created', { 
      orderId: newOrder._id, 
      userId, 
      total: pricing.total,
      restaurant: restaurant.name
    })

    res.status(201).json({
      success: true,
      data: newOrder,
      message: 'Order created successfully'
    })

  } catch (error) {
    logger.error('Error creating order', { error })
    next(error)
  }
}

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { userId } = req.query

    const order = orders.find(o => o._id === id)

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      })
    }

    // Check if user has permission to view this order
    if (userId && order.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      })
    }

    logger.info('Retrieved order by ID', { orderId: id, userId })

    res.json({
      success: true,
      data: order
    })
  } catch (error) {
    next(error)
  }
}

export const getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params
    const { status, page = 1, limit = 10 } = req.query

    let userOrders = orders.filter(o => o.userId === userId)

    // Filter by status if provided
    if (status) {
      userOrders = userOrders.filter(o => o.status === status)
    }

    // Sort by creation date (newest first)
    userOrders.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())

    // Pagination
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const startIndex = (pageNum - 1) * limitNum
    const endIndex = startIndex + limitNum

    const paginatedOrders = userOrders.slice(startIndex, endIndex)

    logger.info('Retrieved user orders', { 
      userId, 
      total: userOrders.length, 
      page: pageNum,
      status 
    })

    res.json({
      success: true,
      data: paginatedOrders,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(userOrders.length / limitNum),
        totalOrders: userOrders.length,
        hasNext: endIndex < userOrders.length,
        hasPrev: pageNum > 1
      }
    })
  } catch (error) {
    next(error)
  }
}

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { status, message } = req.body

    const orderIndex = orders.findIndex(o => o._id === id)
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      })
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'on_route', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      })
    }

    // Update order status
    orders[orderIndex].status = status
    orders[orderIndex].updatedAt = new Date()

    // Add tracking update
    orders[orderIndex].tracking.updates.push({
      status,
      timestamp: new Date(),
      message: message || getDefaultStatusMessage(status)
    })

    // Update estimated delivery if moving to preparing
    if (status === 'preparing') {
      orders[orderIndex].tracking.estimatedDelivery = new Date(Date.now() + orders[orderIndex].delivery.estimatedTime * 60 * 1000)
    }

    logger.info('Order status updated', { 
      orderId: id, 
      oldStatus: orders[orderIndex].status,
      newStatus: status 
    })

    res.json({
      success: true,
      data: orders[orderIndex],
      message: 'Order status updated successfully'
    })
  } catch (error) {
    next(error)
  }
}

export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { userId, reason } = req.body

    const orderIndex = orders.findIndex(o => o._id === id)
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      })
    }

    const order = orders[orderIndex]

    // Check permission
    if (userId && order.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      })
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'confirmed', 'preparing']
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: 'Order cannot be cancelled at this stage'
      })
    }

    // Update order
    orders[orderIndex].status = 'cancelled'
    orders[orderIndex].updatedAt = new Date()
    orders[orderIndex].tracking.updates.push({
      status: 'cancelled',
      timestamp: new Date(),
      message: reason || 'Pedido cancelado por el cliente'
    })

    // In a real app, trigger refund process here
    if (order.payment.status === 'paid') {
      orders[orderIndex].payment.status = 'refunded'
    }

    logger.info('Order cancelled', { 
      orderId: id, 
      userId: order.userId,
      reason 
    })

    res.json({
      success: true,
      data: orders[orderIndex],
      message: 'Order cancelled successfully'
    })
  } catch (error) {
    next(error)
  }
}

// Cart Management
export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params
    const { menuItemId, name, price, quantity, restaurantId, specialInstructions } = req.body

    if (!menuItemId || !name || !price || !quantity || !restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      })
    }

    if (!userCarts[userId]) {
      userCarts[userId] = []
    }

    // Check if item already exists in cart
    const existingItemIndex = userCarts[userId].findIndex(item => 
      item.menuItemId === menuItemId && item.restaurantId === restaurantId
    )

    if (existingItemIndex !== -1) {
      // Update quantity
      userCarts[userId][existingItemIndex].quantity += quantity
      userCarts[userId][existingItemIndex].specialInstructions = specialInstructions
    } else {
      // Add new item
      userCarts[userId].push({
        menuItemId,
        name,
        price,
        quantity,
        restaurantId,
        specialInstructions
      })
    }

    logger.info('Item added to cart', { userId, menuItemId, quantity })

    res.json({
      success: true,
      data: userCarts[userId],
      message: 'Item added to cart'
    })
  } catch (error) {
    next(error)
  }
}

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params

    const cart = userCarts[userId] || []
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    res.json({
      success: true,
      data: {
        items: cart,
        summary: {
          itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: Math.round(subtotal * 100) / 100
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, itemId } = req.params
    const { quantity, specialInstructions } = req.body

    if (!userCarts[userId]) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      })
    }

    const itemIndex = userCarts[userId].findIndex(item => item.menuItemId === itemId)
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in cart'
      })
    }

    if (quantity <= 0) {
      // Remove item
      userCarts[userId].splice(itemIndex, 1)
    } else {
      // Update item
      userCarts[userId][itemIndex].quantity = quantity
      if (specialInstructions !== undefined) {
        userCarts[userId][itemIndex].specialInstructions = specialInstructions
      }
    }

    logger.info('Cart item updated', { userId, itemId, quantity })

    res.json({
      success: true,
      data: userCarts[userId],
      message: 'Cart updated'
    })
  } catch (error) {
    next(error)
  }
}

export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params

    userCarts[userId] = []

    logger.info('Cart cleared', { userId })

    res.json({
      success: true,
      message: 'Cart cleared'
    })
  } catch (error) {
    next(error)
  }
}

// Helper function
const getDefaultStatusMessage = (status: string): string => {
  const messages: { [key: string]: string } = {
    pending: 'Pedido creado, esperando confirmación',
    confirmed: 'Pedido confirmado por el restaurante',
    preparing: 'El restaurante está preparando tu pedido',
    ready: 'Tu pedido está listo para recoger',
    on_route: 'Tu pedido está en camino',
    delivered: 'Pedido entregado',
    cancelled: 'Pedido cancelado'
  }
  return messages[status] || 'Estado actualizado'
}

export const getOrderTracking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const order = orders.find(o => o._id === id)
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      })
    }

    res.json({
      success: true,
      data: {
        orderId: order._id,
        status: order.status,
        estimatedDelivery: order.tracking.estimatedDelivery,
        updates: order.tracking.updates,
        restaurant: order.restaurant,
        delivery: order.delivery
      }
    })
  } catch (error) {
    next(error)
  }
} 
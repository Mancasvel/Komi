import { Router } from 'express'
import {
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  cancelOrder,
  getOrderTracking
} from '../controllers/orderController'

const router = Router()

// POST routes
router.post('/', createOrder)
router.post('/:id/cancel', cancelOrder)

// GET routes
router.get('/user/:userId', getUserOrders)
router.get('/:id', getOrderById)
router.get('/:id/tracking', getOrderTracking)

// PUT routes
router.put('/:id/status', updateOrderStatus)

export default router 
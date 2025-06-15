import { Router } from 'express'
import {
  addToCart,
  getCart,
  updateCartItem,
  clearCart
} from '../controllers/orderController'

const router = Router()

// POST routes
router.post('/:userId/items', addToCart)

// GET routes
router.get('/:userId', getCart)

// PUT routes
router.put('/:userId/items/:itemId', updateCartItem)

// DELETE routes
router.delete('/:userId', clearCart)

export default router 
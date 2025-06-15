import { Router } from 'express'
import {
  subscribeToPush,
  unsubscribeFromPush
} from '../controllers/notificationController'

const router = Router()

// POST routes
router.post('/users/:userId/subscribe', subscribeToPush)
router.post('/users/:userId/unsubscribe', unsubscribeFromPush)

export default router 
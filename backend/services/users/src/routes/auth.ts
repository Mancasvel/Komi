import { Router } from 'express'
import {
  register,
  login,
  verifyToken
} from '../controllers/authController'

const router = Router()

// POST routes
router.post('/register', register)
router.post('/login', login)
router.post('/verify-token', verifyToken)

export default router 
import { Router } from 'express'
import {
  getProfile,
  updateProfile,
  changePassword,
  addAddress,
  deleteUser
} from '../controllers/authController'

const router = Router()

// GET routes
router.get('/:userId/profile', getProfile)

// PUT routes
router.put('/:userId/profile', updateProfile)
router.put('/:userId/password', changePassword)

// POST routes
router.post('/:userId/addresses', addAddress)

// DELETE routes
router.delete('/:userId', deleteUser)

export default router 
import { Router } from 'express'
import {
  getRecommendations,
  getRecommendationById,
  getPopularRecommendations,
  getRecommendationsByLocation,
  saveUserPreferences,
  getAnalytics
} from '../controllers/recommendationController'

const router = Router()

// POST routes
router.post('/', getRecommendations)
router.post('/users/:userId/preferences', saveUserPreferences)

// GET routes
router.get('/popular', getPopularRecommendations)
router.get('/location', getRecommendationsByLocation)
router.get('/analytics', getAnalytics)
router.get('/:id', getRecommendationById)

export default router 
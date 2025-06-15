import { Router } from 'express'
import {
  getAllRestaurants,
  getRestaurantById,
  searchRestaurants,
  getNearbyRestaurants,
  getRestaurantsByCuisine,
  createRestaurant,
  updateRestaurant,
  toggleRestaurantStatus,
  deleteRestaurant
} from '../controllers/restaurantController'

const router = Router()

// GET routes
router.get('/', getAllRestaurants)
router.get('/search', searchRestaurants)
router.get('/nearby', getNearbyRestaurants)
router.get('/cuisine/:cuisine', getRestaurantsByCuisine)
router.get('/:id', getRestaurantById)

// POST routes
router.post('/', createRestaurant)

// PUT routes
router.put('/:id', updateRestaurant)
router.put('/:id/toggle-status', toggleRestaurantStatus)

// DELETE routes
router.delete('/:id', deleteRestaurant)

export default router 
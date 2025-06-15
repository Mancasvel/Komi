import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

// Interfaces
interface Restaurant {
  _id?: string
  name: string
  description: string
  cuisine: string[]
  address: {
    street: string
    city: string
    zipCode: string
    coordinates: [number, number]
  }
  contact: {
    phone: string
    email: string
    website?: string
  }
  hours: {
    [key: string]: { open: string; close: string; closed: boolean }
  }
  pricing: {
    range: number
    deliveryFee: number
    minimumOrder: number
  }
  rating: {
    average: number
    count: number
  }
  images: string[]
  features: string[]
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

// Mock data for development - Replace with MongoDB models
let restaurants: Restaurant[] = [
  {
    _id: '1',
    name: 'Pizza Italiana Mario',
    description: 'Auténtica pizza italiana con ingredientes frescos',
    cuisine: ['italian', 'pizza'],
    address: {
      street: 'Calle Gran Vía 123',
      city: 'Madrid',
      zipCode: '28013',
      coordinates: [-3.7025600, 40.4167754]
    },
    contact: {
      phone: '+34 91 123 4567',
      email: 'info@pizzamario.com',
      website: 'https://pizzamario.com'
    },
    hours: {
      monday: { open: '12:00', close: '23:00', closed: false },
      tuesday: { open: '12:00', close: '23:00', closed: false },
      wednesday: { open: '12:00', close: '23:00', closed: false },
      thursday: { open: '12:00', close: '23:00', closed: false },
      friday: { open: '12:00', close: '00:00', closed: false },
      saturday: { open: '12:00', close: '00:00', closed: false },
      sunday: { open: '12:00', close: '23:00', closed: false }
    },
    pricing: {
      range: 2,
      deliveryFee: 2.5,
      minimumOrder: 15
    },
    rating: {
      average: 4.5,
      count: 127
    },
    images: ['/images/restaurants/mario-1.jpg', '/images/restaurants/mario-2.jpg'],
    features: ['delivery', 'pickup', 'dine-in'],
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-15')
  },
  {
    _id: '2',
    name: 'Veggie Delight',
    description: 'Restaurante vegano con opciones sin gluten',
    cuisine: ['vegan', 'healthy', 'mediterranean'],
    address: {
      street: 'Calle Serrano 45',
      city: 'Madrid',
      zipCode: '28001',
      coordinates: [-3.6879700, 40.4378271]
    },
    contact: {
      phone: '+34 91 987 6543',
      email: 'hola@veggiedelight.com'
    },
    hours: {
      monday: { open: '11:00', close: '22:00', closed: false },
      tuesday: { open: '11:00', close: '22:00', closed: false },
      wednesday: { open: '11:00', close: '22:00', closed: false },
      thursday: { open: '11:00', close: '22:00', closed: false },
      friday: { open: '11:00', close: '23:00', closed: false },
      saturday: { open: '11:00', close: '23:00', closed: false },
      sunday: { open: '11:00', close: '22:00', closed: false }
    },
    pricing: {
      range: 3,
      deliveryFee: 3.0,
      minimumOrder: 20
    },
    rating: {
      average: 4.8,
      count: 89
    },
    images: ['/images/restaurants/veggie-1.jpg'],
    features: ['delivery', 'pickup'],
    isActive: true,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-12-15')
  },
  {
    _id: '3',
    name: 'Curry Palace',
    description: 'Cocina india auténtica con especias importadas',
    cuisine: ['indian', 'curry', 'spicy'],
    address: {
      street: 'Calle Alcalá 78',
      city: 'Madrid',
      zipCode: '28009',
      coordinates: [-3.6795000, 40.4215000]
    },
    contact: {
      phone: '+34 91 555 1234',
      email: 'info@currypalace.es'
    },
    hours: {
      monday: { open: '18:00', close: '23:30', closed: false },
      tuesday: { open: '18:00', close: '23:30', closed: false },
      wednesday: { open: '18:00', close: '23:30', closed: false },
      thursday: { open: '18:00', close: '23:30', closed: false },
      friday: { open: '18:00', close: '00:30', closed: false },
      saturday: { open: '18:00', close: '00:30', closed: false },
      sunday: { open: '18:00', close: '23:30', closed: false }
    },
    pricing: {
      range: 2,
      deliveryFee: 2.0,
      minimumOrder: 18
    },
    rating: {
      average: 4.3,
      count: 156
    },
    images: ['/images/restaurants/curry-1.jpg', '/images/restaurants/curry-2.jpg'],
    features: ['delivery', 'pickup', 'dine-in'],
    isActive: true,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-12-15')
  }
]

// Helper function to calculate distance between coordinates
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Controllers
export const getAllRestaurants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, cuisine, city, minRating, maxPrice, features } = req.query

    let filteredRestaurants = restaurants.filter(r => r.isActive)

    // Apply filters
    if (cuisine) {
      const cuisineFilter = (cuisine as string).toLowerCase()
      filteredRestaurants = filteredRestaurants.filter(r => 
        r.cuisine.some(c => c.toLowerCase().includes(cuisineFilter))
      )
    }

    if (city) {
      filteredRestaurants = filteredRestaurants.filter(r => 
        r.address.city.toLowerCase().includes((city as string).toLowerCase())
      )
    }

    if (minRating) {
      filteredRestaurants = filteredRestaurants.filter(r => 
        r.rating.average >= parseFloat(minRating as string)
      )
    }

    if (maxPrice) {
      filteredRestaurants = filteredRestaurants.filter(r => 
        r.pricing.range <= parseInt(maxPrice as string)
      )
    }

    if (features) {
      const featureFilter = (features as string).split(',')
      filteredRestaurants = filteredRestaurants.filter(r => 
        featureFilter.every(f => r.features.includes(f.trim()))
      )
    }

    // Pagination
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const startIndex = (pageNum - 1) * limitNum
    const endIndex = startIndex + limitNum

    const paginatedRestaurants = filteredRestaurants.slice(startIndex, endIndex)

    logger.info('Retrieved restaurants', { 
      total: filteredRestaurants.length, 
      page: pageNum, 
      limit: limitNum,
      filters: { cuisine, city, minRating, maxPrice, features }
    })

    res.json({
      success: true,
      data: paginatedRestaurants,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(filteredRestaurants.length / limitNum),
        totalRestaurants: filteredRestaurants.length,
        hasNext: endIndex < filteredRestaurants.length,
        hasPrev: pageNum > 1
      }
    })
  } catch (error) {
    next(error)
  }
}

export const getRestaurantById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const restaurant = restaurants.find(r => r._id === id && r.isActive)

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      })
    }

    logger.info('Retrieved restaurant by ID', { restaurantId: id })

    res.json({
      success: true,
      data: restaurant
    })
  } catch (error) {
    next(error)
  }
}

export const searchRestaurants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, lat, lng, radius = 10 } = req.query

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      })
    }

    const searchTerm = (q as string).toLowerCase()
    let results = restaurants.filter(r => 
      r.isActive && (
        r.name.toLowerCase().includes(searchTerm) ||
        r.description.toLowerCase().includes(searchTerm) ||
        r.cuisine.some(c => c.toLowerCase().includes(searchTerm))
      )
    )

    // Apply location filter if coordinates provided
    if (lat && lng) {
      const userLat = parseFloat(lat as string)
      const userLng = parseFloat(lng as string)
      const radiusKm = parseFloat(radius as string)

      results = results.filter(r => {
        const distance = calculateDistance(userLat, userLng, r.address.coordinates[1], r.address.coordinates[0])
        return distance <= radiusKm
      }).map(r => ({
        ...r,
        distance: calculateDistance(userLat, userLng, r.address.coordinates[1], r.address.coordinates[0])
      })).sort((a: any, b: any) => a.distance - b.distance)
    }

    logger.info('Search restaurants', { 
      query: searchTerm, 
      results: results.length,
      location: lat && lng ? { lat, lng, radius } : null
    })

    res.json({
      success: true,
      data: results,
      searchTerm,
      total: results.length
    })
  } catch (error) {
    next(error)
  }
}

export const getNearbyRestaurants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius = 10, limit = 20 } = req.query

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      })
    }

    const userLat = parseFloat(lat as string)
    const userLng = parseFloat(lng as string)
    const radiusKm = parseFloat(radius as string)
    const limitNum = parseInt(limit as string)

    const nearbyRestaurants = restaurants
      .filter(r => r.isActive)
      .map(r => ({
        ...r,
        distance: calculateDistance(userLat, userLng, r.address.coordinates[1], r.address.coordinates[0])
      }))
      .filter(r => r.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limitNum)

    logger.info('Retrieved nearby restaurants', { 
      location: { lat: userLat, lng: userLng },
      radius: radiusKm,
      found: nearbyRestaurants.length
    })

    res.json({
      success: true,
      data: nearbyRestaurants,
      location: { lat: userLat, lng: userLng },
      radius: radiusKm
    })
  } catch (error) {
    next(error)
  }
}

export const getRestaurantsByCuisine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cuisine } = req.params
    const { limit = 20 } = req.query

    const cuisineFilter = cuisine.toLowerCase()
    const filteredRestaurants = restaurants
      .filter(r => r.isActive && r.cuisine.some(c => c.toLowerCase().includes(cuisineFilter)))
      .slice(0, parseInt(limit as string))

    logger.info('Retrieved restaurants by cuisine', { 
      cuisine: cuisineFilter, 
      found: filteredRestaurants.length 
    })

    res.json({
      success: true,
      data: filteredRestaurants,
      cuisine: cuisineFilter,
      total: filteredRestaurants.length
    })
  } catch (error) {
    next(error)
  }
}

export const createRestaurant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantData: Restaurant = {
      ...req.body,
      _id: Date.now().toString(),
      rating: { average: 0, count: 0 },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    restaurants.push(restaurantData)

    logger.info('Restaurant created', { restaurantId: restaurantData._id })

    res.status(201).json({
      success: true,
      data: restaurantData,
      message: 'Restaurant created successfully'
    })
  } catch (error) {
    next(error)
  }
}

export const updateRestaurant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const restaurantIndex = restaurants.findIndex(r => r._id === id)
    if (restaurantIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      })
    }

    restaurants[restaurantIndex] = {
      ...restaurants[restaurantIndex],
      ...updateData,
      updatedAt: new Date()
    }

    logger.info('Restaurant updated', { restaurantId: id })

    res.json({
      success: true,
      data: restaurants[restaurantIndex],
      message: 'Restaurant updated successfully'
    })
  } catch (error) {
    next(error)
  }
}

export const toggleRestaurantStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    
    const restaurantIndex = restaurants.findIndex(r => r._id === id)
    if (restaurantIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      })
    }

    restaurants[restaurantIndex].isActive = !restaurants[restaurantIndex].isActive
    restaurants[restaurantIndex].updatedAt = new Date()

    logger.info('Restaurant status toggled', { 
      restaurantId: id, 
      newStatus: restaurants[restaurantIndex].isActive 
    })

    res.json({
      success: true,
      data: restaurants[restaurantIndex],
      message: `Restaurant ${restaurants[restaurantIndex].isActive ? 'activated' : 'deactivated'} successfully`
    })
  } catch (error) {
    next(error)
  }
}

export const deleteRestaurant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    
    const restaurantIndex = restaurants.findIndex(r => r._id === id)
    if (restaurantIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      })
    }

    const deletedRestaurant = restaurants.splice(restaurantIndex, 1)[0]

    logger.info('Restaurant deleted', { restaurantId: id })

    res.json({
      success: true,
      data: deletedRestaurant,
      message: 'Restaurant deleted successfully'
    })
  } catch (error) {
    next(error)
  }
} 
import { Request, Response, NextFunction } from 'express'
import axios from 'axios'
import { logger } from '../utils/logger'

// Interfaces
interface FoodAnalysis {
  cuisine: string[]
  dietaryRestrictions: string[]
  preferences: string[]
  mood?: string
  urgency: 'low' | 'medium' | 'high'
  spiceLevel?: 'mild' | 'medium' | 'hot'
  priceRange?: number[]
}

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  cuisine: string[]
  dietary: string[]
  spiceLevel?: string
  rating: number
  preparationTime: number
  restaurant: {
    id: string
    name: string
    distance?: number
    deliveryFee: number
  }
  matchScore?: number
}

interface RecommendationRequest {
  text: string
  location?: {
    lat: number
    lng: number
  }
  preferences?: {
    maxPrice?: number
    maxDeliveryTime?: number
    minRating?: number
    preferredCuisines?: string[]
    dietaryRestrictions?: string[]
  }
  userId?: string
}

// Mock menu data for development
const mockMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Pizza Margherita Vegana',
    description: 'Pizza con base de tomate, queso vegano y albahaca fresca',
    price: 12.50,
    cuisine: ['italian', 'pizza'],
    dietary: ['vegan', 'vegetarian'],
    rating: 4.6,
    preparationTime: 25,
    restaurant: {
      id: '2',
      name: 'Veggie Delight',
      distance: 1.2,
      deliveryFee: 3.0
    }
  },
  {
    id: '2', 
    name: 'Curry de Garbanzos Sin Gluten',
    description: 'Curry aromático con garbanzos, leche de coco y especias tradicionales',
    price: 14.90,
    cuisine: ['indian', 'curry'],
    dietary: ['vegan', 'vegetarian', 'gluten-free'],
    spiceLevel: 'medium',
    rating: 4.8,
    preparationTime: 20,
    restaurant: {
      id: '3',
      name: 'Curry Palace',
      distance: 2.1,
      deliveryFee: 2.0
    }
  },
  {
    id: '3',
    name: 'Bowl Mediterráneo Vegano',
    description: 'Quinoa, verduras asadas, hummus, y aliño de tahini',
    price: 11.80,
    cuisine: ['mediterranean', 'healthy'],
    dietary: ['vegan', 'vegetarian', 'gluten-free'],
    rating: 4.5,
    preparationTime: 15,
    restaurant: {
      id: '2',
      name: 'Veggie Delight',
      distance: 1.2,
      deliveryFee: 3.0
    }
  },
  {
    id: '4',
    name: 'Pasta Arrabiata Picante',
    description: 'Pasta con salsa de tomate picante, ajo y guindilla',
    price: 9.90,
    cuisine: ['italian', 'pasta'],
    dietary: ['vegetarian'],
    spiceLevel: 'hot',
    rating: 4.3,
    preparationTime: 18,
    restaurant: {
      id: '1',
      name: 'Pizza Italiana Mario',
      distance: 0.8,
      deliveryFee: 2.5
    }
  },
  {
    id: '5',
    name: 'Tikka Masala de Pollo',
    description: 'Pollo en salsa cremosa de tomate y especias',
    price: 16.50,
    cuisine: ['indian', 'curry'],
    dietary: ['gluten-free'],
    spiceLevel: 'mild',
    rating: 4.7,
    preparationTime: 30,
    restaurant: {
      id: '3',
      name: 'Curry Palace',
      distance: 2.1,
      deliveryFee: 2.0
    }
  },
  {
    id: '6',
    name: 'Risotto de Setas Vegano',
    description: 'Risotto cremoso con setas variadas y levadura nutricional',
    price: 13.20,
    cuisine: ['italian', 'risotto'],
    dietary: ['vegan', 'vegetarian', 'gluten-free'],
    rating: 4.4,
    preparationTime: 35,
    restaurant: {
      id: '1',
      name: 'Pizza Italiana Mario',
      distance: 0.8,
      deliveryFee: 2.5
    }
  }
]

// Helper functions
const calculateMatchScore = (item: MenuItem, analysis: FoodAnalysis, preferences: any = {}): number => {
  let score = 0
  const maxScore = 100

  // Cuisine match (30 points)
  const cuisineMatch = analysis.cuisine.some(c => 
    item.cuisine.some(ic => ic.toLowerCase().includes(c.toLowerCase()))
  )
  if (cuisineMatch) score += 30

  // Dietary restrictions match (25 points)
  const dietaryMatch = analysis.dietaryRestrictions.every(dr =>
    item.dietary.some(id => id.toLowerCase().includes(dr.toLowerCase()))
  )
  if (dietaryMatch && analysis.dietaryRestrictions.length > 0) score += 25

  // Preferences match (20 points)
  const preferencesMatch = analysis.preferences.some(p =>
    item.name.toLowerCase().includes(p.toLowerCase()) ||
    item.description.toLowerCase().includes(p.toLowerCase()) ||
    item.cuisine.some(c => c.toLowerCase().includes(p.toLowerCase()))
  )
  if (preferencesMatch) score += 20

  // Rating (10 points)
  score += (item.rating / 5) * 10

  // Price preference (10 points)
  if (preferences.maxPrice && item.price <= preferences.maxPrice) {
    score += 10
  } else if (!preferences.maxPrice) {
    score += 5 // Neutral if no price preference
  }

  // Delivery time (5 points)
  if (preferences.maxDeliveryTime && item.preparationTime <= preferences.maxDeliveryTime) {
    score += 5
  } else if (!preferences.maxDeliveryTime) {
    score += 2 // Neutral if no time preference
  }

  return Math.min(score, maxScore)
}

const sortRecommendations = (items: MenuItem[]): MenuItem[] => {
  return items.sort((a, b) => {
    // Primary sort: match score
    if (b.matchScore !== a.matchScore) {
      return (b.matchScore || 0) - (a.matchScore || 0)
    }
    
    // Secondary sort: rating
    if (b.rating !== a.rating) {
      return b.rating - a.rating
    }
    
    // Tertiary sort: distance (closer is better)
    return (a.restaurant.distance || 999) - (b.restaurant.distance || 999)
  })
}

// Controllers
export const getRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, location, preferences, userId }: RecommendationRequest = req.body

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text input is required'
      })
    }

    logger.info('Processing recommendation request', { 
      text, 
      hasLocation: !!location, 
      userId 
    })

    // Step 1: Analyze text using NLP service
    let analysis: FoodAnalysis
    try {
      const nlpServiceUrl = process.env.NLP_SERVICE_URL || 'http://localhost:3002'
      const nlpResponse = await axios.post(`${nlpServiceUrl}/api/analyze`, { text })
      analysis = nlpResponse.data.analysis
    } catch (nlpError) {
      logger.error('NLP service error, using fallback analysis', { error: nlpError })
      // Fallback analysis
      analysis = {
        cuisine: text.toLowerCase().includes('curry') ? ['indian'] : 
                 text.toLowerCase().includes('pizza') ? ['italian'] : ['general'],
        dietaryRestrictions: [
          ...(text.toLowerCase().includes('vegano') || text.toLowerCase().includes('vegan') ? ['vegan'] : []),
          ...(text.toLowerCase().includes('sin gluten') || text.toLowerCase().includes('gluten-free') ? ['gluten-free'] : []),
          ...(text.toLowerCase().includes('vegetariano') ? ['vegetarian'] : [])
        ],
        preferences: text.toLowerCase().split(' ').filter(word => 
          ['curry', 'pizza', 'pasta', 'ensalada', 'sopa'].includes(word)
        ),
        urgency: 'medium'
      }
    }

    logger.info('NLP analysis completed', { analysis })

    // Step 2: Filter menu items based on analysis
    let filteredItems = mockMenuItems.filter(item => {
      // Check dietary restrictions
      if (analysis.dietaryRestrictions.length > 0) {
        const meetsDietary = analysis.dietaryRestrictions.every(restriction =>
          item.dietary.some(d => d.toLowerCase().includes(restriction.toLowerCase()))
        )
        if (!meetsDietary) return false
      }

      // Check price range if specified
      if (preferences?.maxPrice && item.price > preferences.maxPrice) {
        return false
      }

      // Check minimum rating
      if (preferences?.minRating && item.rating < preferences.minRating) {
        return false
      }

      // Check preferred cuisines
      if (preferences?.preferredCuisines && preferences.preferredCuisines.length > 0) {
        const matchesCuisine = preferences.preferredCuisines.some(pc =>
          item.cuisine.some(ic => ic.toLowerCase().includes(pc.toLowerCase()))
        )
        if (!matchesCuisine) return false
      }

      return true
    })

    // Step 3: Calculate match scores
    filteredItems = filteredItems.map(item => ({
      ...item,
      matchScore: calculateMatchScore(item, analysis, preferences)
    }))

    // Step 4: Sort by relevance
    const sortedItems = sortRecommendations(filteredItems)

    // Step 5: Limit results based on urgency
    const limit = analysis.urgency === 'high' ? 3 : 
                 analysis.urgency === 'medium' ? 6 : 10
    const recommendations = sortedItems.slice(0, limit)

    // Step 6: Add additional metadata
    const response = {
      success: true,
      data: {
        recommendations,
        analysis,
        metadata: {
          totalFound: filteredItems.length,
          showing: recommendations.length,
          searchTerm: text,
          location: location || null,
          appliedFilters: {
            dietary: analysis.dietaryRestrictions,
            cuisine: analysis.cuisine,
            preferences: analysis.preferences,
            maxPrice: preferences?.maxPrice,
            minRating: preferences?.minRating
          }
        }
      },
      timestamp: new Date().toISOString()
    }

    logger.info('Recommendations generated', {
      userId,
      totalRecommendations: recommendations.length,
      topScore: recommendations[0]?.matchScore || 0,
      analysis
    })

    res.json(response)

  } catch (error) {
    logger.error('Error generating recommendations', { error })
    next(error)
  }
}

export const getRecommendationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    
    const item = mockMenuItems.find(item => item.id === id)
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      })
    }

    logger.info('Retrieved recommendation by ID', { itemId: id })

    res.json({
      success: true,
      data: item
    })
  } catch (error) {
    next(error)
  }
}

export const getPopularRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 10, cuisine, dietary } = req.query

    let popularItems = [...mockMenuItems]

    // Filter by cuisine if specified
    if (cuisine) {
      const cuisineFilter = (cuisine as string).toLowerCase()
      popularItems = popularItems.filter(item =>
        item.cuisine.some(c => c.toLowerCase().includes(cuisineFilter))
      )
    }

    // Filter by dietary if specified
    if (dietary) {
      const dietaryFilter = (dietary as string).toLowerCase()
      popularItems = popularItems.filter(item =>
        item.dietary.some(d => d.toLowerCase().includes(dietaryFilter))
      )
    }

    // Sort by rating and then by random factor for diversity
    popularItems.sort((a, b) => {
      const ratingDiff = b.rating - a.rating
      if (Math.abs(ratingDiff) < 0.2) {
        // If ratings are close, add some randomness
        return Math.random() - 0.5
      }
      return ratingDiff
    })

    const limitNum = parseInt(limit as string)
    const results = popularItems.slice(0, limitNum)

    logger.info('Retrieved popular recommendations', {
      total: results.length,
      filters: { cuisine, dietary }
    })

    res.json({
      success: true,
      data: results,
      metadata: {
        total: popularItems.length,
        showing: results.length,
        filters: { cuisine, dietary }
      }
    })
  } catch (error) {
    next(error)
  }
}

export const getRecommendationsByLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius = 5, limit = 15 } = req.query

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      })
    }

    const userLat = parseFloat(lat as string)
    const userLng = parseFloat(lng as string)
    const radiusKm = parseFloat(radius as string)

    // For this mock, we'll just return items within the radius
    // In a real implementation, you'd calculate actual distances
    const nearbyItems = mockMenuItems.filter(item => {
      const distance = item.restaurant.distance || 0
      return distance <= radiusKm
    })

    // Sort by distance and rating
    nearbyItems.sort((a, b) => {
      const distanceA = a.restaurant.distance || 999
      const distanceB = b.restaurant.distance || 999
      return distanceA - distanceB
    })

    const limitNum = parseInt(limit as string)
    const results = nearbyItems.slice(0, limitNum)

    logger.info('Retrieved location-based recommendations', {
      location: { lat: userLat, lng: userLng },
      radius: radiusKm,
      found: results.length
    })

    res.json({
      success: true,
      data: results,
      location: { lat: userLat, lng: userLng, radius: radiusKm },
      metadata: {
        total: nearbyItems.length,
        showing: results.length
      }
    })
  } catch (error) {
    next(error)
  }
}

export const saveUserPreferences = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params
    const preferences = req.body

    // In a real implementation, save to database
    logger.info('User preferences saved', { userId, preferences })

    res.json({
      success: true,
      message: 'Preferences saved successfully',
      data: preferences
    })
  } catch (error) {
    next(error)
  }
}

export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Mock analytics data
    const analytics = {
      popularCuisines: [
        { cuisine: 'italian', requests: 145, percentage: 28.5 },
        { cuisine: 'indian', requests: 98, percentage: 19.3 },
        { cuisine: 'mediterranean', requests: 76, percentage: 14.9 },
        { cuisine: 'asian', requests: 67, percentage: 13.2 },
        { cuisine: 'mexican', requests: 45, percentage: 8.8 }
      ],
      commonDietaryRestrictions: [
        { restriction: 'vegetarian', requests: 203, percentage: 39.9 },
        { restriction: 'vegan', requests: 156, percentage: 30.6 },
        { restriction: 'gluten-free', requests: 89, percentage: 17.5 },
        { restriction: 'dairy-free', requests: 34, percentage: 6.7 }
      ],
      averageMatchScore: 76.8,
      totalRecommendations: 509,
      successfulOrders: 387,
      conversionRate: 76.0
    }

    logger.info('Analytics data retrieved')

    res.json({
      success: true,
      data: analytics,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    next(error)
  }
} 
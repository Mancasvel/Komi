import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { logger } from '../utils/logger'

// Interfaces
interface User {
  _id?: string
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  preferences: {
    dietaryRestrictions: string[]
    favoritesCuisines: string[]
    defaultLocation?: {
      address: string
      coordinates: [number, number]
    }
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
  }
  addresses: Array<{
    id: string
    name: string
    street: string
    city: string
    zipCode: string
    coordinates: [number, number]
    isDefault: boolean
  }>
  role: 'user' | 'restaurant_owner' | 'admin'
  isEmailVerified: boolean
  isActive: boolean
  lastLogin?: Date
  createdAt?: Date
  updatedAt?: Date
}

interface LoginRequest {
  email: string
  password: string
}

interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

// Mock users data for development
let users: User[] = [
  {
    _id: 'user123',
    email: 'juan@example.com',
    password: '$2b$10$xyz123hashedpassword', // hashed password for "password123"
    firstName: 'Juan',
    lastName: 'García',
    phone: '+34 666 123 456',
    preferences: {
      dietaryRestrictions: ['vegetarian'],
      favoritesCuisines: ['italian', 'mediterranean'],
      defaultLocation: {
        address: 'Calle Mayor 15, Madrid',
        coordinates: [-3.7025600, 40.4167754]
      },
      notifications: {
        email: true,
        push: true,
        sms: false
      }
    },
    addresses: [
      {
        id: 'addr1',
        name: 'Casa',
        street: 'Calle Mayor 15',
        city: 'Madrid',
        zipCode: '28013',
        coordinates: [-3.7025600, 40.4167754],
        isDefault: true
      }
    ],
    role: 'user',
    isEmailVerified: true,
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date()
  }
]

// Helper functions
const generateJWT = (userId: string, email: string): string => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key'
  return jwt.sign(
    { userId, email },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

const generateUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Controllers
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, phone }: RegisterRequest = req.body

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, firstName, and lastName are required'
      })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      })
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Password validation failed',
        details: passwordValidation.errors
      })
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create new user
    const newUser: User = {
      _id: generateUserId(),
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      preferences: {
        dietaryRestrictions: [],
        favoritesCuisines: [],
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      },
      addresses: [],
      role: 'user',
      isEmailVerified: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    users.push(newUser)

    // Generate JWT
    const token = generateJWT(newUser._id!, newUser.email)

    // Remove password from response
    const { password: _, ...userResponse } = newUser

    logger.info('User registered successfully', { 
      userId: newUser._id, 
      email: newUser.email 
    })

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        token
      },
      message: 'User registered successfully'
    })

  } catch (error) {
    logger.error('Registration error', { error })
    next(error)
  }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password }: LoginRequest = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      })
    }

    // Find user
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      })
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      })
    }

    // Update last login
    const userIndex = users.findIndex(u => u._id === user._id)
    users[userIndex].lastLogin = new Date()
    users[userIndex].updatedAt = new Date()

    // Generate JWT
    const token = generateJWT(user._id!, user.email)

    // Remove password from response
    const { password: _, ...userResponse } = users[userIndex]

    logger.info('User logged in successfully', { 
      userId: user._id, 
      email: user.email 
    })

    res.json({
      success: true,
      data: {
        user: userResponse,
        token
      },
      message: 'Login successful'
    })

  } catch (error) {
    logger.error('Login error', { error })
    next(error)
  }
}

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params

    const user = users.find(u => u._id === userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    // Remove password from response
    const { password: _, ...userResponse } = user

    logger.info('User profile retrieved', { userId })

    res.json({
      success: true,
      data: userResponse
    })

  } catch (error) {
    next(error)
  }
}

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params
    const updateData = req.body

    const userIndex = users.findIndex(u => u._id === userId)
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    // Prevent updating sensitive fields
    const allowedFields = ['firstName', 'lastName', 'phone', 'avatar', 'preferences']
    const filteredUpdateData: any = {}
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field]
      }
    })

    // Update user
    users[userIndex] = {
      ...users[userIndex],
      ...filteredUpdateData,
      updatedAt: new Date()
    }

    // Remove password from response
    const { password: _, ...userResponse } = users[userIndex]

    logger.info('User profile updated', { userId, updatedFields: Object.keys(filteredUpdateData) })

    res.json({
      success: true,
      data: userResponse,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    next(error)
  }
}

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      })
    }

    const userIndex = users.findIndex(u => u._id === userId)
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    const user = users[userIndex]

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      })
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'New password validation failed',
        details: passwordValidation.errors
      })
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword)

    // Update password
    users[userIndex].password = hashedNewPassword
    users[userIndex].updatedAt = new Date()

    logger.info('User password changed', { userId })

    res.json({
      success: true,
      message: 'Password changed successfully'
    })

  } catch (error) {
    next(error)
  }
}

export const addAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params
    const { name, street, city, zipCode, coordinates, isDefault } = req.body

    if (!name || !street || !city || !zipCode) {
      return res.status(400).json({
        success: false,
        error: 'Name, street, city, and zipCode are required'
      })
    }

    const userIndex = users.findIndex(u => u._id === userId)
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    // If this is the default address, update existing addresses
    if (isDefault) {
      users[userIndex].addresses.forEach(addr => {
        addr.isDefault = false
      })
    }

    // Add new address
    const newAddress = {
      id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name,
      street,
      city,
      zipCode,
      coordinates: coordinates || [0, 0],
      isDefault: isDefault || users[userIndex].addresses.length === 0
    }

    users[userIndex].addresses.push(newAddress)
    users[userIndex].updatedAt = new Date()

    logger.info('Address added', { userId, addressId: newAddress.id })

    res.status(201).json({
      success: true,
      data: newAddress,
      message: 'Address added successfully'
    })

  } catch (error) {
    next(error)
  }
}

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params

    const userIndex = users.findIndex(u => u._id === userId)
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    // In a real app, you might want to soft delete instead
    users[userIndex].isActive = false
    users[userIndex].updatedAt = new Date()

    logger.info('User account deactivated', { userId })

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    })

  } catch (error) {
    next(error)
  }
}

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      })
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_key'
    const decoded = jwt.verify(token, secret) as any

    const user = users.find(u => u._id === decoded.userId)
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      })
    }

    // Remove password from response
    const { password: _, ...userResponse } = user

    res.json({
      success: true,
      data: userResponse
    })

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      })
    }
    next(error)
  }
} 
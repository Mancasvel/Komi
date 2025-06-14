import OpenAI from 'openai'
import { logger } from '../utils/logger'

// Configurar OpenAI client para usar OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
})

export interface FoodAnalysis {
  intent: string
  confidence: number
  ingredients: string[]
  cuisineTypes: string[]
  dietaryRestrictions: string[]
  preparationMethods: string[]
  mealType: string
  urgency: 'low' | 'medium' | 'high'
  mood: string
  priceRange: 'budget' | 'moderate' | 'premium' | 'any'
  portionSize: 'small' | 'medium' | 'large' | 'any'
  temperature: 'hot' | 'cold' | 'room_temperature' | 'any'
  nutritionalInfo?: {
    isHealthy: boolean
    estimatedCalories: string
    macronutrients: string[]
  }
  filters: {
    vegetarian: boolean
    vegan: boolean
    glutenFree: boolean
    dairyFree: boolean
    nutFree: boolean
    kosher: boolean
    halal: boolean
    organic: boolean
    spicy: boolean
    sweet: boolean
  }
  originalText: string
  processedAt: string
}

export class NLPController {
  private model: string

  constructor() {
    this.model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku'
  }

  /**
   * Analiza texto en lenguaje natural para extraer información alimentaria
   */
  async analyzeText(text: string, language: string = 'es', includeNutrition: boolean = false): Promise<FoodAnalysis> {
    try {
      const prompt = this.buildAnalysisPrompt(text, language, includeNutrition)
      
      logger.info(`Sending analysis request to OpenRouter model: ${this.model}`)
      
      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "Eres un experto en análisis de texto relacionado con comida y preferencias alimentarias. Analiza el texto del usuario y extrae información estructurada en formato JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from OpenRouter')
      }

      // Intentar parsear la respuesta JSON
      let analysis: FoodAnalysis
      try {
        // Limpiar la respuesta por si tiene markdown
        const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim()
        analysis = JSON.parse(cleanedResponse)
      } catch (parseError) {
        logger.error('Error parsing OpenRouter response:', parseError)
        // Fallback con análisis básico
        analysis = this.createFallbackAnalysis(text)
      }

      // Asegurar que todos los campos requeridos estén presentes
      analysis = this.validateAndCompleteAnalysis(analysis, text)
      
      logger.info(`Analysis completed for: "${text.substring(0, 50)}..."`)
      
      return analysis

    } catch (error) {
      logger.error('Error in NLP analysis:', error)
      // En caso de error, devolver análisis básico
      return this.createFallbackAnalysis(text)
    }
  }

  /**
   * Extrae entidades específicas del texto
   */
  async extractEntities(text: string): Promise<any> {
    try {
      const prompt = `
        Extrae las siguientes entidades del texto: "${text}"
        
        Devuelve un JSON con:
        - ingredients: array de ingredientes mencionados
        - cuisines: array de tipos de cocina
        - restrictions: array de restricciones dietéticas
        - methods: array de métodos de preparación
        - locations: array de ubicaciones mencionadas
        
        Solo texto en español, respuesta en JSON puro sin markdown.
      `

      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: "Extrae entidades de texto relacionado con comida. Responde solo en JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 300,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from OpenRouter')
      }

      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim()
      return JSON.parse(cleanedResponse)

    } catch (error) {
      logger.error('Error extracting entities:', error)
      return {
        ingredients: [],
        cuisines: [],
        restrictions: [],
        methods: [],
        locations: []
      }
    }
  }

  /**
   * Clasifica la intención del usuario
   */
  async classifyIntent(text: string): Promise<any> {
    try {
      const prompt = `
        Clasifica la intención del siguiente texto: "${text}"
        
        Posibles intenciones:
        - search: buscar comida
        - order: hacer un pedido
        - recommend: pedir recomendaciones
        - info: solicitar información
        - complaint: queja o problema
        - other: otra intención
        
        Devuelve JSON con:
        - intent: la intención principal
        - confidence: confianza (0-1)
        - subIntent: sub-intención específica si aplica
      `

      const completion = await openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: "Clasifica intenciones de texto sobre comida. Responde solo en JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 150,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from OpenRouter')
      }

      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim()
      return JSON.parse(cleanedResponse)

    } catch (error) {
      logger.error('Error classifying intent:', error)
      return {
        intent: 'search',
        confidence: 0.5,
        subIntent: 'general'
      }
    }
  }

  /**
   * Construye el prompt para análisis completo
   */
  private buildAnalysisPrompt(text: string, language: string, includeNutrition: boolean): string {
    const nutritionSection = includeNutrition ? `
    - nutritionalInfo: {
        isHealthy: boolean (si es considerado saludable),
        estimatedCalories: string (rango estimado de calorías),
        macronutrients: string[] (principales macronutrientes)
      }` : ''

    return `
      Analiza este texto sobre preferencias alimentarias: "${text}"
      
      Devuelve un JSON con exactamente esta estructura:
      {
        "intent": "search|order|recommend|info|other",
        "confidence": 0.0-1.0,
        "ingredients": ["array", "de", "ingredientes"],
        "cuisineTypes": ["italiana", "asiática", "etc"],
        "dietaryRestrictions": ["vegano", "sin gluten", "etc"],
        "preparationMethods": ["frito", "horneado", "etc"],
        "mealType": "desayuno|almuerzo|cena|merienda|aperitivo",
        "urgency": "low|medium|high",
        "mood": "descripción del estado de ánimo",
        "priceRange": "budget|moderate|premium|any",
        "portionSize": "small|medium|large|any",
        "temperature": "hot|cold|room_temperature|any",${nutritionSection}
        "filters": {
          "vegetarian": boolean,
          "vegan": boolean,
          "glutenFree": boolean,
          "dairyFree": boolean,
          "nutFree": boolean,
          "kosher": boolean,
          "halal": boolean,
          "organic": boolean,
          "spicy": boolean,
          "sweet": boolean
        }
      }
      
      Analiza el texto en ${language === 'es' ? 'español' : 'inglés'} y responde SOLO el JSON, sin markdown ni explicaciones.
    `
  }

  /**
   * Crea un análisis de fallback cuando falla la API
   */
  private createFallbackAnalysis(text: string): FoodAnalysis {
    const lowerText = text.toLowerCase()
    
    return {
      intent: 'search',
      confidence: 0.7,
      ingredients: this.extractBasicIngredients(lowerText),
      cuisineTypes: this.extractBasicCuisines(lowerText),
      dietaryRestrictions: this.extractBasicRestrictions(lowerText),
      preparationMethods: [],
      mealType: this.detectMealType(lowerText),
      urgency: 'medium',
      mood: 'neutral',
      priceRange: 'any',
      portionSize: 'any',
      temperature: 'any',
      filters: {
        vegetarian: lowerText.includes('vegetarian') || lowerText.includes('vegetariano'),
        vegan: lowerText.includes('vegan') || lowerText.includes('vegano'),
        glutenFree: lowerText.includes('gluten free') || lowerText.includes('sin gluten'),
        dairyFree: lowerText.includes('dairy free') || lowerText.includes('sin lácteos'),
        nutFree: lowerText.includes('nut free') || lowerText.includes('sin frutos secos'),
        kosher: lowerText.includes('kosher'),
        halal: lowerText.includes('halal'),
        organic: lowerText.includes('organic') || lowerText.includes('orgánico'),
        spicy: lowerText.includes('spicy') || lowerText.includes('picante'),
        sweet: lowerText.includes('sweet') || lowerText.includes('dulce')
      },
      originalText: text,
      processedAt: new Date().toISOString()
    }
  }

  /**
   * Valida y completa el análisis
   */
  private validateAndCompleteAnalysis(analysis: any, originalText: string): FoodAnalysis {
    return {
      intent: analysis.intent || 'search',
      confidence: analysis.confidence || 0.7,
      ingredients: Array.isArray(analysis.ingredients) ? analysis.ingredients : [],
      cuisineTypes: Array.isArray(analysis.cuisineTypes) ? analysis.cuisineTypes : [],
      dietaryRestrictions: Array.isArray(analysis.dietaryRestrictions) ? analysis.dietaryRestrictions : [],
      preparationMethods: Array.isArray(analysis.preparationMethods) ? analysis.preparationMethods : [],
      mealType: analysis.mealType || 'any',
      urgency: analysis.urgency || 'medium',
      mood: analysis.mood || 'neutral',
      priceRange: analysis.priceRange || 'any',
      portionSize: analysis.portionSize || 'any',
      temperature: analysis.temperature || 'any',
      nutritionalInfo: analysis.nutritionalInfo,
      filters: {
        vegetarian: analysis.filters?.vegetarian || false,
        vegan: analysis.filters?.vegan || false,
        glutenFree: analysis.filters?.glutenFree || false,
        dairyFree: analysis.filters?.dairyFree || false,
        nutFree: analysis.filters?.nutFree || false,
        kosher: analysis.filters?.kosher || false,
        halal: analysis.filters?.halal || false,
        organic: analysis.filters?.organic || false,
        spicy: analysis.filters?.spicy || false,
        sweet: analysis.filters?.sweet || false
      },
      originalText,
      processedAt: new Date().toISOString()
    }
  }

  // Métodos de utilidad para análisis básico
  private extractBasicIngredients(text: string): string[] {
    const ingredients = ['pollo', 'pescado', 'carne', 'pasta', 'arroz', 'verduras', 'queso', 'tomate', 'cebolla']
    return ingredients.filter(ingredient => text.includes(ingredient))
  }

  private extractBasicCuisines(text: string): string[] {
    const cuisines = ['italiana', 'asiática', 'mexicana', 'india', 'mediterránea', 'japonesa', 'china', 'tailandesa']
    return cuisines.filter(cuisine => text.includes(cuisine))
  }

  private extractBasicRestrictions(text: string): string[] {
    const restrictions: string[] = []
    if (text.includes('vegano')) restrictions.push('vegano')
    if (text.includes('vegetariano')) restrictions.push('vegetariano')
    if (text.includes('sin gluten')) restrictions.push('sin gluten')
    if (text.includes('sin lácteos')) restrictions.push('sin lácteos')
    return restrictions
  }

  private detectMealType(text: string): string {
    if (text.includes('desayuno')) return 'desayuno'
    if (text.includes('almuerzo') || text.includes('comida')) return 'almuerzo'
    if (text.includes('cena')) return 'cena'
    if (text.includes('merienda')) return 'merienda'
    return 'any'
  }

  /**
   * Obtiene lista de cocinas soportadas
   */
  getSupportedCuisines(): string[] {
    return [
      'italiana', 'asiática', 'mexicana', 'india', 'mediterránea', 'japonesa',
      'china', 'tailandesa', 'francesa', 'española', 'árabe', 'peruana',
      'argentina', 'brasileña', 'coreana', 'vietnamita', 'griega', 'turca'
    ]
  }

  /**
   * Obtiene lista de restricciones dietéticas
   */
  getDietaryRestrictions(): string[] {
    return [
      'vegano', 'vegetariano', 'sin gluten', 'sin lácteos', 'sin frutos secos',
      'kosher', 'halal', 'diabético', 'bajo en sodio', 'bajo en grasa',
      'keto', 'paleo', 'mediterránea', 'sin azúcar'
    ]
  }
} 
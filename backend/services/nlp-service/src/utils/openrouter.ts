/**
 * Utilidades específicas para OpenRouter
 * Configuración para el modelo nvidia/llama-3.3-nemotron-super-49b-v1:free
 */

export interface OpenRouterConfig {
  apiKey: string
  baseURL: string
  model: string
  httpReferer?: string
  siteTitle?: string
}

export interface OpenRouterResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * Obtiene la configuración de OpenRouter desde las variables de entorno
 */
export function getOpenRouterConfig(): OpenRouterConfig {
  return {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    model: process.env.OPENROUTER_MODEL || 'nvidia/llama-3.3-nemotron-super-49b-v1:free',
    httpReferer: process.env.OPENROUTER_HTTP_REFERER || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteTitle: process.env.OPENROUTER_SITE_TITLE || 'Komi - Pedidos con IA'
  }
}

/**
 * Realiza una llamada directa a OpenRouter usando fetch
 * Útil para casos específicos donde se necesita más control sobre la request
 */
export async function callOpenRouter(
  messages: Array<{ role: string; content: string }>,
  config?: Partial<OpenRouterConfig>
): Promise<OpenRouterResponse> {
  const fullConfig = { ...getOpenRouterConfig(), ...config }
  
  if (!fullConfig.apiKey) {
    throw new Error('OPENROUTER_API_KEY is required')
  }

  const response = await fetch(`${fullConfig.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${fullConfig.apiKey}`,
      "HTTP-Referer": fullConfig.httpReferer || '',
      "X-Title": fullConfig.siteTitle || '',
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: fullConfig.model,
      messages: messages
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
  }

  return response.json() as Promise<OpenRouterResponse>
}

/**
 * Wrapper simplificado para análisis de texto de comida
 */
export async function analyzeFood(text: string): Promise<string> {
  const messages = [
    {
      role: "system",
      content: `Eres un asistente especializado en análisis de preferencias alimentarias. 
      Analiza el texto del usuario y devuelve un JSON con:
      - cuisine: tipo de cocina (italiana, española, china, etc.)
      - dietaryRestrictions: restricciones dietéticas (vegano, sin gluten, etc.)
      - preferences: preferencias específicas
      - mood: estado de ánimo o contexto
      - urgency: nivel de urgencia (alta, media, baja)
      
      Responde SOLO con JSON válido, sin texto adicional.`
    },
    {
      role: "user",
      content: text
    }
  ]

  try {
    const response = await callOpenRouter(messages)
    return response.choices[0]?.message?.content || '{}'
  } catch (error) {
    console.error('Error analyzing food:', error)
    throw error
  }
}

/**
 * Constantes para el modelo específico que usamos
 */
export const OPENROUTER_CONSTANTS = {
  MODEL: 'nvidia/llama-3.3-nemotron-super-49b-v1:free',
  BASE_URL: 'https://openrouter.ai/api/v1',
  MAX_TOKENS: 4096,
  TEMPERATURE: 0.7,
  TOP_P: 0.9
} as const 
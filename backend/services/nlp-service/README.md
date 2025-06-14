# Komi NLP Service

Servicio de procesamiento de lenguaje natural que analiza texto relacionado con comida usando OpenRouter AI.

## 🧠 Funcionalidades

- **Análisis de texto completo**: Extrae ingredientes, restricciones dietéticas, tipo de cocina, etc.
- **Clasificación de intenciones**: Determina si el usuario quiere buscar, ordenar, recomendar, etc.
- **Extracción de entidades**: Identifica ingredientes, métodos de cocción, ubicaciones, etc.
- **Soporte multiidioma**: Español e inglés
- **Cache inteligente**: Resultados en cache para mejorar rendimiento
- **Análisis nutricional**: Información opcional sobre calorías y macronutrientes

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

## 🔧 Variables de Entorno

```bash
# Puerto del servicio
NLP_SERVICE_PORT=3002

# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=anthropic/claude-3-haiku

# Configuración
NODE_ENV=development
LOG_LEVEL=info
```

## 📡 API Endpoints

### POST /analyze
Analiza texto completo para extraer toda la información alimentaria.

**Request:**
```json
{
  "text": "Me apetece algo vegano con curry pero sin gluten",
  "language": "es",
  "includeNutrition": false
}
```

**Response:**
```json
{
  "intent": "search",
  "confidence": 0.95,
  "ingredients": ["curry"],
  "cuisineTypes": ["india", "asiática"],
  "dietaryRestrictions": ["vegano", "sin gluten"],
  "preparationMethods": [],
  "mealType": "any",
  "urgency": "medium",
  "mood": "craving",
  "priceRange": "any",
  "portionSize": "any",
  "temperature": "hot",
  "filters": {
    "vegetarian": true,
    "vegan": true,
    "glutenFree": true,
    "dairyFree": false,
    "nutFree": false,
    "kosher": false,
    "halal": false,
    "organic": false,
    "spicy": true,
    "sweet": false
  },
  "originalText": "Me apetece algo vegano con curry pero sin gluten",
  "processedAt": "2024-01-15T10:30:00.000Z",
  "cached": false,
  "processingTime": 1250
}
```

### POST /extract-entities
Extrae entidades específicas del texto.

**Request:**
```json
{
  "text": "Quiero pizza italiana con pepperoni cerca de Madrid"
}
```

**Response:**
```json
{
  "text": "Quiero pizza italiana con pepperoni cerca de Madrid",
  "entities": {
    "ingredients": ["pepperoni"],
    "cuisines": ["italiana"],
    "restrictions": [],
    "methods": [],
    "locations": ["Madrid"]
  },
  "processingTime": 850
}
```

### POST /classify-intent
Clasifica la intención del usuario.

**Request:**
```json
{
  "text": "¿Podrías recomendarme algo saludable?"
}
```

**Response:**
```json
{
  "text": "¿Podrías recomendarme algo saludable?",
  "intent": {
    "intent": "recommend",
    "confidence": 0.92,
    "subIntent": "healthy_options"
  },
  "processingTime": 650
}
```

### GET /supported-cuisines
Lista de tipos de cocina soportados.

**Response:**
```json
{
  "cuisines": [
    "italiana", "asiática", "mexicana", "india", "mediterránea",
    "japonesa", "china", "tailandesa", "francesa", "española"
  ],
  "total": 18
}
```

### GET /dietary-restrictions
Lista de restricciones dietéticas reconocidas.

**Response:**
```json
{
  "restrictions": [
    "vegano", "vegetariano", "sin gluten", "sin lácteos",
    "kosher", "halal", "diabético", "keto", "paleo"
  ],
  "total": 14
}
```

### GET /health
Estado de salud del servicio.

**Response:**
```json
{
  "status": "healthy",
  "service": "nlp-service",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "openrouter": "connected"
}
```

### GET /stats
Estadísticas del servicio.

**Response:**
```json
{
  "service": "nlp-service",
  "cache": {
    "keys": 45,
    "hits": 120,
    "misses": 30,
    "hitRate": 0.8
  },
  "uptime": 3600,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🧪 Desarrollo

```bash
# Modo desarrollo con hot reload
npm run dev

# Build para producción
npm run build

# Ejecutar tests
npm test

# Linting
npm run lint
```

## 🔄 Cache

El servicio utiliza cache en memoria para optimizar respuestas:
- **TTL**: 1 hora por defecto
- **Limpieza**: `DELETE /cache` (solo en desarrollo)
- **Estadísticas**: `GET /stats`

## 🐛 Fallback y Error Handling

Si OpenRouter no está disponible, el servicio usa análisis básico:
- Detección por palabras clave
- Patrones de texto predefinidos
- Respuesta degradada pero funcional

## 📊 Logging

El servicio registra:
- Peticiones de análisis
- Errores de OpenRouter
- Cache hits/misses
- Estadísticas de rendimiento

## 🔗 Integración

Este servicio se integra con:
- **API Gateway**: Enrutamiento y autenticación
- **Menu Recommender**: Proporciona análisis para recomendaciones
- **Restaurants Service**: Filtros de búsqueda

## 📈 Métricas

- Tiempo de respuesta promedio: ~1.2s
- Cache hit rate objetivo: >80%
- Disponibilidad objetivo: 99.9% 
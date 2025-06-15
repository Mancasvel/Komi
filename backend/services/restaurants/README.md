# 🍽️ Komi Restaurants Service

Microservicio para la gestión de restaurantes y menús en la plataforma Komi.

## 📋 Funcionalidades

### Restaurantes
- ✅ **CRUD completo** de restaurantes
- ✅ **Búsqueda avanzada** por nombre, tipo de cocina, ubicación
- ✅ **Filtros** por precio, ratings, tiempo de entrega
- ✅ **Geolocalización** - restaurantes cercanos
- ✅ **Gestión de imágenes** - fotos de restaurantes
- ✅ **Estado en tiempo real** - abierto/cerrado
- ✅ **Horarios de funcionamiento**

### Menús
- ✅ **Gestión de menús** por restaurante
- ✅ **Categorías de platos** (entrantes, principales, postres)
- ✅ **Información nutricional**
- ✅ **Restricciones dietéticas** (vegano, sin gluten, etc.)
- ✅ **Precios y promociones**
- ✅ **Disponibilidad en tiempo real**

### Categorías
- ✅ **Tipos de cocina** (italiana, china, mexicana, etc.)
- ✅ **Etiquetas** (fast food, gourmet, saludable)
- ✅ **Filtros personalizados**

## 🚀 Endpoints

### Restaurantes
```
GET    /api/restaurants              # Obtener todos los restaurantes
GET    /api/restaurants/search       # Buscar restaurantes
GET    /api/restaurants/nearby       # Restaurantes cercanos
GET    /api/restaurants/cuisine/:type # Por tipo de cocina
GET    /api/restaurants/:id          # Obtener restaurante por ID
POST   /api/restaurants              # Crear restaurante (auth)
PUT    /api/restaurants/:id          # Actualizar restaurante (auth)
PATCH  /api/restaurants/:id/status   # Cambiar estado (auth)
DELETE /api/restaurants/:id          # Eliminar restaurante (auth)
```

### Menús
```
GET    /api/menus/restaurant/:id     # Menús de un restaurante
GET    /api/menus/:id                # Obtener menú por ID
POST   /api/menus                    # Crear menú (auth)
PUT    /api/menus/:id                # Actualizar menú (auth)
DELETE /api/menus/:id                # Eliminar menú (auth)
```

### Categorías
```
GET    /api/categories               # Todas las categorías
GET    /api/categories/:id           # Categoría por ID
POST   /api/categories               # Crear categoría (auth)
PUT    /api/categories/:id           # Actualizar categoría (auth)
DELETE /api/categories/:id           # Eliminar categoría (auth)
```

### Salud
```
GET    /health                       # Estado del servicio
```

## 🔧 Configuración

### Variables de Entorno
```bash
# Puerto del servicio
RESTAURANTS_SERVICE_PORT=3003

# Base de datos
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/komi

# Autenticación
JWT_SECRET=your-jwt-secret

# Archivos
UPLOAD_PATH=uploads/restaurants
MAX_FILE_SIZE=5mb

# Logging
LOG_LEVEL=info
```

### Instalación
```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Producción
npm run build
npm start

# Tests
npm test
```

## 📊 Modelos de Datos

### Restaurant
```typescript
{
  _id: ObjectId
  name: string
  description: string
  cuisine: string[]
  address: {
    street: string
    city: string
    zipCode: string
    coordinates: [longitude, latitude]
  }
  contact: {
    phone: string
    email: string
    website?: string
  }
  hours: {
    [day]: { open: string, close: string, closed: boolean }
  }
  pricing: {
    range: 1-4  // $ to $$$$
    deliveryFee: number
    minimumOrder: number
  }
  rating: {
    average: number
    count: number
  }
  images: string[]
  features: string[]  // delivery, pickup, dine-in
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Menu
```typescript
{
  _id: ObjectId
  restaurantId: ObjectId
  name: string
  description?: string
  category: string
  items: [{
    name: string
    description: string
    price: number
    image?: string
    dietary: string[]  // vegan, gluten-free, etc.
    nutrients: {
      calories: number
      protein: number
      carbs: number
      fat: number
    }
    available: boolean
    preparationTime: number  // minutes
  }]
  createdAt: Date
  updatedAt: Date
}
```

## 🔍 Ejemplos de Uso

### Buscar restaurantes cercanos
```bash
GET /api/restaurants/nearby?lat=40.7128&lng=-74.0060&radius=5km
```

### Buscar por tipo de cocina
```bash
GET /api/restaurants/cuisine/italian?price=1,2&rating=4
```

### Crear restaurante
```bash
POST /api/restaurants
Authorization: Bearer <token>

{
  "name": "Pizza Mario",
  "description": "Auténtica pizza italiana",
  "cuisine": ["italian"],
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zipCode": "10001",
    "coordinates": [-74.0060, 40.7128]
  },
  "contact": {
    "phone": "+1-555-123-4567",
    "email": "info@pizzamario.com"
  }
}
```

## 🧪 Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Coverage
npm run test:coverage
```

## 📦 Dependencias Principales

- **express** - Framework web
- **mongoose** - ODM para MongoDB
- **joi** - Validación de datos
- **multer** - Upload de archivos
- **sharp** - Procesamiento de imágenes
- **geolib** - Cálculos geográficos
- **winston** - Logging

## 🚀 Desarrollo

### Estructura del Proyecto
```
src/
├── controllers/     # Lógica de negocio
├── middleware/      # Middleware personalizado
├── models/         # Modelos de MongoDB
├── routes/         # Definición de rutas
├── utils/          # Utilidades
├── validators/     # Validaciones
└── index.ts        # Punto de entrada
```

### Scripts NPM
```bash
npm run dev         # Desarrollo con hot reload
npm run build       # Build para producción
npm start           # Iniciar en producción
npm run lint        # Linter
npm run test        # Tests
```

## 🔐 Seguridad

- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Helmet para headers de seguridad
- ✅ Validación de entrada
- ✅ Autenticación JWT
- ✅ Logging de seguridad

## 📈 Monitoring

- ✅ Health check endpoint
- ✅ Logs estructurados
- ✅ Métricas de rendimiento
- ✅ Error tracking

## 🤝 Contribuir

1. Fork del repositorio
2. Crear rama feature
3. Commit cambios
4. Push a la rama
5. Crear Pull Request

## 📄 Licencia

MIT © Komi Team 
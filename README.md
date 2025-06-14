# Komi - Progressive Web App para Pedidos de Comida

Komi es una Progressive Web App (PWA) fullstack que permite a los usuarios escribir en lenguaje natural qué quieren comer y les recomienda menús de restaurantes con opción de pedido a domicilio.

## 🏗️ Arquitectura

### Frontend
- **Next.js 15** con App Router
- **Tailwind CSS** para estilos
- **PWA** configurada para web y móvil
- Comunicación con backend vía REST API

### Backend
- **MongoDB Atlas** como base de datos principal
- **Microservicios** organizados en arquitectura modular
- **OpenRouter** para procesamiento de lenguaje natural
- **API Gateway** para enrutamiento de servicios

## 📁 Estructura del Proyecto

```
komi/
├── frontend/                    # Next.js 15 PWA Frontend
├── backend/
│   ├── api-gateway/            # API Gateway principal
│   ├── services/
│   │   ├── nlp-service/        # Procesamiento de lenguaje natural
│   │   ├── menu-recommender/   # Recomendador de menús
│   │   ├── restaurants/        # Gestión de restaurantes y menús
│   │   ├── orders/             # Gestión de pedidos
│   │   ├── users/              # Autenticación y usuarios
│   │   └── notifications/      # Notificaciones (opcional)
│   └── shared/                 # Utilidades compartidas
├── docs/                       # Documentación
└── scripts/                    # Scripts de desarrollo
```

## 🚀 Microservicios

### 1. NLP Service
- **Propósito**: Procesa lenguaje natural del usuario
- **Input**: Texto libre ("me apetece algo vegano con curry pero sin gluten")
- **Output**: JSON estructurado con entidades extraídas
- **Tecnología**: OpenRouter API

### 2. Menu Recommender
- **Propósito**: Recomienda menús basados en filtros del NLP
- **Input**: Filtros estructurados del NLP Service
- **Output**: Lista de menús ordenados por relevancia

### 3. Restaurants Service
- **Propósito**: CRUD completo de restaurantes, platos y menús
- **Funciones**: Gestión de disponibilidad, precios, categorías

### 4. Orders Service
- **Propósito**: Gestión completa del flujo de pedidos
- **Funciones**: Crear, actualizar, cancelar, pagar pedidos
- **Preparado para**: Integración con Stripe

### 5. Users Service
- **Propósito**: Autenticación y gestión de usuarios
- **Funciones**: Perfil, historial, preferencias alimentarias
- **Tecnología**: NextAuth.js

### 6. Notifications Service (Opcional)
- **Propósito**: Notificaciones push y en tiempo real
- **Preparado para**: Firebase Cloud Messaging

## 🛠️ Instalación y Desarrollo

### Prerrequisitos
- Node.js 18+
- MongoDB Atlas account
- OpenRouter API key

### Configuración rápida
```bash
# Instalar dependencias
npm run install:all

# Configurar variables de entorno
cp .env.example .env.local

# Iniciar todos los servicios
npm run dev
```

## 🌟 Funcionalidades Principales

1. **Procesamiento de Lenguaje Natural**: Entiende frases complejas sobre preferencias alimentarias
2. **Recomendaciones Inteligentes**: Sugiere menús relevantes basados en la intención del usuario
3. **Gestión de Pedidos**: Flujo completo desde selección hasta pago
4. **PWA Ready**: Funciona offline y se puede instalar como app nativa
5. **Responsive Design**: Optimizada para móvil y desktop

## 🔧 Scripts de Desarrollo

- `npm run dev` - Inicia todos los servicios en modo desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run test` - Ejecuta todos los tests
- `npm run lint` - Verifica el código
- `npm run install:all` - Instala dependencias de todos los servicios

## 📚 Documentación

- [Guía de Desarrollo](./docs/development.md)
- [API Reference](./docs/api.md)
- [Arquitectura Detallada](./docs/architecture.md)
- [Deployment](./docs/deployment.md)

## 🤝 Contribución

Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para detalles sobre cómo contribuir al proyecto.

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](./LICENSE) para más detalles.
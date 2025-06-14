# Configuración de Variables de Entorno - Komi

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```bash
# =================================================================
# KOMI - CONFIGURACIÓN DE VARIABLES DE ENTORNO
# =================================================================

# =================================================================
# CONFIGURACIÓN GENERAL
# =================================================================
NODE_ENV=development
APP_NAME=Komi
APP_VERSION=1.0.0

# =================================================================
# FRONTEND (Next.js)
# =================================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Komi
FRONTEND_URL=http://localhost:3000

# =================================================================
# API GATEWAY
# =================================================================
API_GATEWAY_PORT=3001
API_GATEWAY_HOST=localhost

# =================================================================
# MICROSERVICIOS - PUERTOS
# =================================================================
NLP_SERVICE_PORT=3002
NLP_SERVICE_HOST=localhost

RESTAURANTS_SERVICE_PORT=3003
RESTAURANTS_SERVICE_HOST=localhost

USERS_SERVICE_PORT=3004
USERS_SERVICE_HOST=localhost

ORDERS_SERVICE_PORT=3005
ORDERS_SERVICE_PORT=localhost

MENU_RECOMMENDER_PORT=3006
MENU_RECOMMENDER_HOST=localhost

NOTIFICATIONS_SERVICE_PORT=3007
NOTIFICATIONS_SERVICE_HOST=localhost

# =================================================================
# BASE DE DATOS - MONGODB ATLAS
# =================================================================
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/komi?retryWrites=true&w=majority
MONGODB_DB_NAME=komi

# Base de datos por microservicio (opcional, se puede usar una sola)
MONGODB_USERS_DB=komi_users
MONGODB_RESTAURANTS_DB=komi_restaurants
MONGODB_ORDERS_DB=komi_orders

# =================================================================
# OPENROUTER API (Para NLP) - Configuración específica
# =================================================================
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=nvidia/llama-3.3-nemotron-super-49b-v1:free

# Headers adicionales para OpenRouter (opcional para rankings)
OPENROUTER_HTTP_REFERER=http://localhost:3000
OPENROUTER_SITE_TITLE=Komi - Pedidos con IA

# =================================================================
# AUTENTICACIÓN (NextAuth.js)
# =================================================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here_generate_a_strong_random_string

# Proveedores OAuth (opcional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# =================================================================
# PAGOS (Stripe) - Para futuras implementaciones
# =================================================================
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# =================================================================
# NOTIFICACIONES (Firebase) - Opcional
# =================================================================
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# =================================================================
# CONFIGURACIÓN DE SERVICIOS EXTERNOS
# =================================================================
# APIs de mapas y geolocalización
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Servicio de email (opcional)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@komi.app

# =================================================================
# CONFIGURACIÓN DE DESARROLLO Y SEGURIDAD
# =================================================================
LOG_LEVEL=debug
ENABLE_CORS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# JWT
JWT_SECRET=your_jwt_secret_here_generate_a_strong_random_string
JWT_EXPIRES_IN=24h

# =================================================================
# CONFIGURACIÓN PWA
# =================================================================
PWA_CACHE_STRATEGY=NetworkFirst
PWA_OFFLINE_FALLBACK=true

# =================================================================
# CONFIGURACIÓN DE TESTING
# =================================================================
TEST_MONGODB_URI=mongodb://localhost:27017/komi_test
TEST_API_PORT=4001

# =================================================================
# CONFIGURACIÓN DE CACHE (Redis - Opcional)
# =================================================================
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password
CACHE_TTL=3600

# =================================================================
# CONFIGURACIÓN DE MONITOREO (Opcional)
# =================================================================
SENTRY_DSN=your_sentry_dsn_for_error_tracking
ANALYTICS_ID=your_analytics_id
```

## 🔧 Instrucciones para configurar OpenRouter

1. **Crear cuenta en OpenRouter**:
   - Ve a https://openrouter.ai/
   - Crea una cuenta gratuita
   - Ve a tu dashboard y copia tu API Key

2. **Configurar variables**:
   - Pega la API Key en `OPENROUTER_API_KEY`
   - El modelo `nvidia/llama-3.3-nemotron-super-49b-v1:free` es gratuito
   - Opcional: configura `OPENROUTER_HTTP_REFERER` y `OPENROUTER_SITE_TITLE` para rankings

3. **MongoDB Atlas**:
   - Crea un cluster gratuito en https://cloud.mongodb.com/
   - Obtén la connection string y configura `MONGODB_URI`

4. **NextAuth Secret**:
   - Genera una clave secreta: `openssl rand -base64 32`
   - Configura `NEXTAUTH_SECRET`

## 📋 Variables mínimas para desarrollo

Para empezar rápidamente, configura al menos estas variables:

```bash
# Básico para desarrollo local
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# OpenRouter (requerido para NLP)
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=nvidia/llama-3.3-nemotron-super-49b-v1:free

# MongoDB (requerido para datos)
MONGODB_URI=your_mongodb_connection_string

# NextAuth (requerido para autenticación)
NEXTAUTH_SECRET=your_generated_secret
NEXTAUTH_URL=http://localhost:3000
``` 
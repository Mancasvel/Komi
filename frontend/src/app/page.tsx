'use client'

import { useState } from 'react'
import { Search, Sparkles, Clock, MapPin, Star, ChefHat } from 'lucide-react'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<any[]>([])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    // TODO: Integrar con API Gateway
    // const response = await fetch('/api/search', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ query: searchQuery })
    // })
    
    // Datos mock para desarrollo
    setTimeout(() => {
      setRecommendations([
        {
          id: 1,
          restaurant: 'La Veggie Box',
          dish: 'Bowl Vegano con Curry de Coco',
          description: 'Delicioso bowl vegano con curry de coco, sin gluten',
          price: 14.50,
          rating: 4.8,
          deliveryTime: '25-35 min',
          image: '/placeholder-food-1.jpg'
        },
        {
          id: 2,
          restaurant: 'Green Kitchen',
          dish: 'Curry Vegano Thai',
          description: 'Auténtico curry thai vegano, completamente sin gluten',
          price: 16.90,
          rating: 4.9,
          deliveryTime: '30-40 min',
          image: '/placeholder-food-2.jpg'
        },
        {
          id: 3,
          restaurant: 'Plant Paradise',
          dish: 'Curry de Lentejas Rojas',
          description: 'Curry cremoso de lentejas rojas, vegano y sin gluten',
          price: 13.20,
          rating: 4.7,
          deliveryTime: '20-30 min',
          image: '/placeholder-food-3.jpg'
        }
      ])
      setIsLoading(false)
    }, 2000)
  }

  const exampleQueries = [
    "Me apetece algo vegano con curry pero sin gluten",
    "Quiero pizza italiana auténtica",
    "Busco comida asiática picante",
    "Algo saludable y bajo en calorías"
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-soft">
                <Sparkles className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-medium text-primary-600">Powered by AI</span>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              Dile a <span className="text-gradient">Komi</span> qué
              <br />
              quieres comer
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 text-balance">
              Usa lenguaje natural para describir lo que te apetece. 
              Komi entiende tus preferencias y encuentra los mejores menús para ti.
            </p>
            
            {/* Search Bar */}
            <div className="mx-auto mt-10 max-w-2xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Me apetece algo vegano con curry pero sin gluten..."
                    className="w-full rounded-xl border border-neutral-200 bg-white pl-12 pr-4 py-4 text-base shadow-soft focus:border-primary-300 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isLoading || !searchQuery.trim()}
                  className="btn-primary btn-lg rounded-xl px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="loading-dots text-white">
                      <div></div><div></div><div></div><div></div>
                    </div>
                  ) : (
                    <>
                      <ChefHat className="h-5 w-5 mr-2" />
                      Buscar
                    </>
                  )}
                </button>
              </div>
              
              {/* Example queries */}
              <div className="mt-6">
                <p className="text-sm text-neutral-500 mb-3">Prueba con ejemplos:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {exampleQueries.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchQuery(query)}
                      className="text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 rounded-full transition-colors"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {recommendations.length > 0 && (
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-8">
              Recomendaciones para ti
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((item) => (
                <div key={item.id} className="card-hover group cursor-pointer">
                  <div className="aspect-[4/3] bg-neutral-100 rounded-lg mb-4 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                      <ChefHat className="h-12 w-12 text-primary-400" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                          {item.dish}
                        </h3>
                        <p className="text-sm text-neutral-600">{item.restaurant}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-neutral-900">€{item.price}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-neutral-600 line-clamp-2">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-neutral-500">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-current text-yellow-400" />
                        <span>{item.rating}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{item.deliveryTime}</span>
                      </div>
                    </div>
                    
                    <button className="w-full btn-primary btn-md mt-4">
                      Añadir al carrito
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900">
              ¿Cómo funciona Komi?
            </h2>
            <p className="mt-4 text-lg text-neutral-600">
              Tecnología de inteligencia artificial para entender exactamente lo que quieres
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center mb-6">
                <Search className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                Describe lo que quieres
              </h3>
              <p className="text-neutral-600">
                Usa lenguaje natural. "Algo vegano con curry pero sin gluten" o "Pizza italiana auténtica"
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-secondary-100 flex items-center justify-center mb-6">
                <Sparkles className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                IA procesa tu petición
              </h3>
              <p className="text-neutral-600">
                Nuestro motor de IA entiende ingredientes, restricciones dietéticas y preferencias
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-accent-100 flex items-center justify-center mb-6">
                <MapPin className="h-8 w-8 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                Encuentra restaurantes
              </h3>
              <p className="text-neutral-600">
                Te mostramos los mejores menús que coinciden con lo que buscas, cerca de ti
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 
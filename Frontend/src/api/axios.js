import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
})

// Intercepteur requête — token + gestion FormData
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('senmed_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Pour les FormData, supprimer Content-Type afin qu'axios génère automatiquement
  // le header multipart/form-data avec le bon boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

// Intercepteur réponse — gestion centralisée des erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('senmed_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

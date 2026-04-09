import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
})

// Intercepteur requête — ajoute le token si présent
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('senmed_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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

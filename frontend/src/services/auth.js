const TOKEN_KEY = 'token'
const USER_KEY = 'user'

export const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

// Get token from localStorage
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

// Remove token from localStorage
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getToken()
  if (!token) return false
  
  // Check if token is expired
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp
    if (exp && Date.now() >= exp * 1000) {
      removeToken()
      return false
    }
    return true
  } catch (error) {
    return false
  }
}

// Store user data
export const setUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

// Get user data
export const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY)
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch (error) {
      return null
    }
  }
  return null
}

// Clear all auth data
export const clearAuthData = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// Get auth header for API requests
export const getAuthHeader = () => {
  const token = getToken()
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

// Decode JWT token
export const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch (error) {
    return null
  }
}

// Check if token is expired
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) return true
  return Date.now() >= decoded.exp * 1000
}

// Refresh token (if needed)
export const refreshToken = async () => {
  // Implementation depends on your refresh token strategy
  // For now, just return current token
  return getToken()
}

// Interceptor for API requests
export const authInterceptor = (config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

// Handle 401 responses
export const handleUnauthorized = () => {
  clearAuthData()
  window.location.href = '/login'
}

export default {
  setToken,
  getToken,
  removeToken,
  isAuthenticated,
  setUser,
  getUser,
  clearAuthData,
  getAuthHeader,
  decodeToken,
  isTokenExpired,
  refreshToken,
  authInterceptor,
  handleUnauthorized
}
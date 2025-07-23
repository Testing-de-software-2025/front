
import axios from "axios"
import { config } from "../config/env"

const axiosService = axios.create({
  baseURL: "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor para convertir radius a número si existe en el body
axiosService.interceptors.request.use(
  (config) => {
    if (config.data && typeof config.data === "object" && config.data.radius !== undefined) {
      config.data.radius = Number(config.data.radius);
    }
    // Interceptor para asegurar que offset sea un número válido en params
    if (config.params && typeof config.params === "object" && config.params.offset !== undefined) {
      let offset = Number(config.params.offset);
      if (isNaN(offset) || offset < 0) {
        offset = 0;
      }
      config.params.offset = offset;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Flag to prevent multiple refresh attempts
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (reason?: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  failedQueue = []
}

// URLs that should not trigger token refresh logic
const AUTH_ENDPOINTS = [config.urls.logIn, config.urls.register, config.urls.refreshAccessToken]

// Function to check if the request is to an auth endpoint
const isAuthEndpoint = (url: string): boolean => {
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint))
}

// Function to check if token needs refresh based on timestamp
const checkTokenExpiration = (): boolean => {
  const tokenCreatedAt = localStorage.getItem("token_created_at")
  if (!tokenCreatedAt) {
    return true // No timestamp, consider expired
  }

  const createdTime = Number.parseInt(tokenCreatedAt)
  const currentTime = new Date().getTime()
  const timeDifference = currentTime - createdTime
  const TOKEN_EXPIRY_TIME = 15 * 60 * 1000 // 15 minutes

  return timeDifference >= TOKEN_EXPIRY_TIME
}

// Function to refresh token proactively
const refreshTokenProactively = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem("refresh_token")
  if (!refreshToken) {
    throw new Error("No refresh token available")
  }

  try {
    console.log("Attempting proactive token refresh...")

    const response = await axios.post(config.urls.refreshAccessToken, {
      refreshToken: refreshToken,
    })

    const { accessToken, refreshToken: newRefreshToken } = response.data

    // Save new tokens with timestamp
    const now = new Date().getTime()
    localStorage.setItem("access_token", accessToken)
    localStorage.setItem("refresh_token", newRefreshToken)
    localStorage.setItem("token_created_at", now.toString())

    console.log("Token refreshed proactively")
    return accessToken
  } catch (error) {
    console.error("Proactive token refresh failed:", error)
    throw error
  }
}

// Interceptor to add token and check expiration before each request
axiosService.interceptors.request.use(
  async (config) => {
    const requestUrl = config.url || ""

    // Skip token logic for auth endpoints
    if (isAuthEndpoint(requestUrl)) {
      console.log("Skipping token check for auth endpoint:", requestUrl)
      return config
    }

    // Check if we have tokens before proceeding
    const accessToken = localStorage.getItem("access_token")
    const refreshToken = localStorage.getItem("refresh_token")

    if (!accessToken || !refreshToken) {
      console.log("No tokens available, skipping token refresh logic")
      return config
    }

    // Check if token is expired before making the request
    if (checkTokenExpiration()) {
      console.log("Token expired, refreshing before request...")

      if (isRefreshing) {
        // If already refreshing, wait for it to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => {
          const newAccessToken = localStorage.getItem("access_token")
          if (newAccessToken) {
            config.headers.Authorization = `Bearer ${newAccessToken}`
          }
          return config
        })
      }

      isRefreshing = true

      try {
        const newToken = await refreshTokenProactively()
        processQueue(null, newToken)

        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`
        }
      } catch (error) {
        processQueue(error, null)

        // Clear tokens and redirect to login
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("token_created_at")

        if (window.location.pathname !== "/login") {
          window.location.href = "/login"
        }

        throw error
      } finally {
        isRefreshing = false
      }
    } else {
      // Token is still valid, add it to headers
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for handling 401 errors (fallback)
axiosService.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    const requestUrl = originalRequest.url || ""

    // Skip 401 handling for auth endpoints
    if (isAuthEndpoint(requestUrl)) {
      return Promise.reject(error)
    }

    // Handle 401 errors as fallback (shouldn't happen often with proactive refresh)
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log("Received 401 error, attempting token refresh...")

      const refreshToken = localStorage.getItem("refresh_token")
      if (!refreshToken) {
        console.log("No refresh token available for 401 handling")
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("token_created_at")

        if (window.location.pathname !== "/login") {
          window.location.href = "/login"
        }
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return axiosService(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const newToken = await refreshTokenProactively()
        processQueue(null, newToken)

        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return axiosService(originalRequest)
      } catch (refreshError: any) {
        processQueue(refreshError, null)

        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("token_created_at")

        if (window.location.pathname !== "/login") {
          window.location.href = "/login"
        }

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    if (error.response?.status === 403) {
      console.error("Acceso denegado: No tienes permisos para realizar esta acción")
    }

    return Promise.reject(error)
  },
)

export { axiosService }
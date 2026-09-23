import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, tokens } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const qc = useQueryClient()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(tokens.access))

  const loadMe = useCallback(async () => {
    try {
      const { data } = await api.get('/me/')
      setUser(data)
    } catch {
      tokens.clear()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tokens.access) loadMe()
    const onLogout = () => setUser(null)
    window.addEventListener('pixshelf:logout', onLogout)
    return () => window.removeEventListener('pixshelf:logout', onLogout)
  }, [loadMe])

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login/', { username, password })
    tokens.set(data)
    qc.clear() // cached lists may differ now that private pictures are visible
    await loadMe()
  }

  const register = async (username, email, password) => {
    await api.post('/auth/register/', { username, email, password })
    await login(username, password)
  }

  const logout = () => {
    tokens.clear()
    setUser(null)
    qc.clear()
  }

  const updateMe = async (formData) => {
    const { data } = await api.patch('/me/', formData)
    setUser(data)
    qc.invalidateQueries({ queryKey: ['user', data.username] })
    return data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateMe }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

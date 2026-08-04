import React, { createContext, useContext, useState, useCallback } from 'react'
import { API_BASE_URL } from './config'

type User = {
  id: number
  username: string
  email: string | null
}

type AuthContextValue = {
  token: string | null
  user: User | null
  login: (
    username: string,
    password: string,
    keepSignedIn?: boolean,
  ) => Promise<void>
  register: (username: string, password: string, email: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function requestAuth(
  path: 'login' | 'register',
  body: { username: string; password: string; email?: string },
) {
  const res = await fetch(`${API_BASE_URL}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data?.error || 'Something went wrong')
  }

  return data as { token: string; user: User }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('authToken') || sessionStorage.getItem('authToken'),
  )
  const [user, setUser] = useState<User | null>(() => {
    const raw =
      localStorage.getItem('authUser') || sessionStorage.getItem('authUser')
    return raw ? JSON.parse(raw) : null
  })

  const persist = (
    data: { token: string; user: User },
    keepSignedIn: boolean,
  ) => {
    const storage = keepSignedIn ? localStorage : sessionStorage
    const other = keepSignedIn ? sessionStorage : localStorage
    storage.setItem('authToken', data.token)
    storage.setItem('authUser', JSON.stringify(data.user))
    other.removeItem('authToken')
    other.removeItem('authUser')
    setToken(data.token)
    setUser(data.user)
  }

  const login = useCallback(
    async (username: string, password: string, keepSignedIn = true) => {
      persist(await requestAuth('login', { username, password }), keepSignedIn)
    },
    [],
  )

  const register = useCallback(
    async (username: string, password: string, email: string) => {
      persist(await requestAuth('register', { username, password, email }), true)
    },
    [],
  )

  const logout = useCallback(() => {
    const currentToken = token
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    sessionStorage.removeItem('authToken')
    sessionStorage.removeItem('authUser')
    setToken(null)
    setUser(null)

    if (currentToken) {
      fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` },
      }).catch(() => {})
    }
  }, [token])

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

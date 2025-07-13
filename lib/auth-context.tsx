'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type UserRole = 'public' | 'internal'

interface AuthContextType {
  role: UserRole
  isInternal: boolean
  login: (password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 簡單的密碼 - 實際使用時可以改成更安全的方案
const INTERNAL_PASSWORD = '90575771'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('public')

  useEffect(() => {
    // 檢查本地存儲中的身份信息
    const savedRole = localStorage.getItem('userRole') as UserRole
    if (savedRole === 'internal') {
      setRole('internal')
    }
  }, [])

  const login = (password: string): boolean => {
    if (password === INTERNAL_PASSWORD) {
      setRole('internal')
      localStorage.setItem('userRole', 'internal')
      return true
    }
    return false
  }

  const logout = () => {
    setRole('public')
    localStorage.removeItem('userRole')
  }

  const value = {
    role,
    isInternal: role === 'internal',
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 
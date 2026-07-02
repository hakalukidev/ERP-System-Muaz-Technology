'use client'

import { onAuthStateChanged, type User } from 'firebase/auth'
import { useEffect, useState } from 'react'

import { auth } from '../firebase/config'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
    })
  }, [])

  return { user }
}


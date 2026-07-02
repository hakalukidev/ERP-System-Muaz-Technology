'use client'

import { collection, onSnapshot, query, where, type Query } from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { db } from '../firebase/config'

type QueryFilter = {
  field: string
  operator: Parameters<typeof where>[1]
  value: any
}

export function useCollection<T = any>(collectionName: string, filters?: QueryFilter[]) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    let q: Query = collection(db, collectionName)

    if (filters?.length) {
      filters.forEach(({ field, operator, value }) => {
        q = query(q, where(field, operator, value))
      })
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T))
        setData(items)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [collectionName, JSON.stringify(filters)])

  return { data, loading, error }
}

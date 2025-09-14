// File: /src/hooks/useTransactionFetch.js
// React hook for on-demand transaction fetching
import { useState, useEffect } from 'react'

export function useTransactionFetch(accountNumber, userId) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fetchInfo, setFetchInfo] = useState(null)
  const [canRefresh, setCanRefresh] = useState(true)

  const fetchTransactions = async (forceRefresh = false) => {
    if (loading) return
    
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/transactions/fetch-on-demand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_number: accountNumber,
          user_id: userId,
          force_refresh: forceRefresh
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transactions')
      }

      setFetchInfo(data)
      
      // Always allow refresh - user can force refresh anytime
      setCanRefresh(true)

      return data

    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch on mount (when app opens)
  useEffect(() => {
    if (accountNumber && userId) {
      fetchTransactions()
    }
  }, [accountNumber, userId])

  return {
    loading,
    error,
    fetchInfo,
    canRefresh,
    fetchTransactions,
    forceRefresh: () => fetchTransactions(true)
  }
}
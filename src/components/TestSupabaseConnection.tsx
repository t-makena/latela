'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Client = {
  id: string
  uuid: string
  created_at: string
  email: string
  Name: string
  is_active: boolean
}

export default function TestSupabaseConnection() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
      
      if (error) {
        setError(error.message)
      } else {
        setClients(data || [])
      }
    } catch (err) {
      setError('Failed to fetch clients')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Testing Supabase Connection</h2>
        <div className="animate-pulse">Loading clients...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Testing Supabase Connection</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Testing Supabase Connection</h2>
      
      {clients.length === 0 ? (
        <div className="text-gray-500">No clients found</div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            ✅ Successfully connected to Supabase! Found {clients.length} client(s).
          </div>
          
          {clients.map((client) => (
            <div key={client.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Name:</strong> {client.Name}</div>
                <div><strong>Email:</strong> {client.email}</div>
                <div><strong>UUID:</strong> {client.uuid.substring(0, 8)}...</div>
                <div><strong>Active:</strong> {client.is_active ? '✅' : '❌'}</div>
                <div><strong>Created:</strong> {new Date(client.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
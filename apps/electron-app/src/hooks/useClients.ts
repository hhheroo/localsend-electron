import { useState, useEffect, useCallback } from 'react'
import type { Client } from '../types/electron'
import { logger } from '../utils/logger'

export type { Client }

export function useClients() {
  const [clients, setClients] = useState<Map<string, Client>>(new Map())
  const [loading, setLoading] = useState(true)

  // Add client
  const addClient = useCallback((client: Client) => {
    setClients(prev => {
      const next = new Map(prev)
      next.set(client.fingerprint, client)
      return next
    })
  }, [])

  // Remove client
  const removeClient = useCallback((fingerprint: string) => {
    setClients(prev => {
      const next = new Map(prev)
      next.delete(fingerprint)
      return next
    })
  }, [])

  // Initialize and fetch client list
  useEffect(() => {
    const fetchClients = async () => {
      if (!window.electronAPI) {
        setLoading(false)
        return
      }

      try {
        const clientList = await window.electronAPI.getClients()
        const clientMap = new Map<string, Client>()
        for (const client of clientList) {
          clientMap.set(client.fingerprint, client)
        }
        setClients(clientMap)
      } catch (error) {
        logger.error('Failed to fetch clients:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  // Listen to client changes
  useEffect(() => {
    if (!window.electronAPI) {
      return
    }

    // Listen to client registered
    const unsubscribeRegistered = window.electronAPI.onClientRegistered((client) => {
      logger.log('Client registered:', client)
      addClient(client)
    })

    // Listen to client unregistered
    const unsubscribeUnregistered = window.electronAPI.onClientUnregistered((fingerprint) => {
      logger.log('Client unregistered:', fingerprint)
      removeClient(fingerprint)
    })

    return () => {
      unsubscribeRegistered()
      unsubscribeUnregistered()
    }
  }, [addClient, removeClient])

  // Refresh client list
  const refresh = useCallback(async () => {
    if (!window.electronAPI) return

    setLoading(true)
    
    try {
      // Clear entire map first
      setClients(new Map())
      
      // Initiate device discovery
      await window.electronAPI.discover()
      
      const clientList = await window.electronAPI.getClients()
      const clientMap = new Map<string, Client>()
      for (const client of clientList) {
        clientMap.set(client.fingerprint, client)
      }
      setClients(clientMap)
    } catch (error) {
      logger.error('Failed to refresh clients:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Return client array
  const clientList = Array.from(clients.values())

  return {
    clients: clientList,
    clientCount: clientList.length,
    loading,
    refresh,
  }
}

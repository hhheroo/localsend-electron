import { useState, useEffect } from 'react'
import type { ReceiveSession, ReceiveSessionFile } from '../types/electron'
import { logger } from '../utils/logger'

// Receive progress state
export interface ReceiveProgress {
  sessionId: string
  senderName: string
  senderFingerprint: string
  files: {
    id: string
    name: string
    size: number
    status: 'pending' | 'receiving' | 'done' | 'error'
  }[]
  status: 'receiving' | 'done' | 'cancelled'
}

export function useReceiveProgress() {
  const [receiveProgress, setReceiveProgress] = useState<ReceiveProgress | null>(null)

  // Listen to receive file events
  useEffect(() => {
    if (!window.electronAPI) return

    // Received new receive request
    const unsubSessionCreated = window.electronAPI.onReceiveSessionCreated((session: ReceiveSession) => {
      logger.log('Receive session created:', session)
      
      const files = Object.values(session.req.files).map((file: ReceiveSessionFile) => ({
        id: file.id,
        name: file.fileName,
        size: file.size,
        status: 'pending' as const
      }))

      setReceiveProgress({
        sessionId: session.id,
        senderName: session.req.info.alias,
        senderFingerprint: session.req.info.fingerprint,
        files,
        status: 'receiving'
      })
    })

    // Receive cancelled
    const unsubSessionCancelled = window.electronAPI.onReceiveSessionCancelled((sessionId: string) => {
      logger.log('Receive session cancelled:', sessionId)
      setReceiveProgress(prev => {
        if (prev && prev.sessionId === sessionId) {
          return { ...prev, status: 'cancelled' }
        }
        return prev
      })
    })

    // File upload complete
    const unsubFileUploaded = window.electronAPI.onReceiveFileUploaded((sessionId: string, fileId: string) => {
      logger.log('Receive file uploaded:', sessionId, fileId)
      setReceiveProgress(prev => {
        if (prev && prev.sessionId === sessionId) {
          const newFiles = prev.files.map(f => 
            f.id === fileId ? { ...f, status: 'done' as const } : f
          )
          // Check if all files are done
          const allDone = newFiles.every(f => f.status === 'done')
          return { 
            ...prev, 
            files: newFiles,
            status: allDone ? 'done' : 'receiving'
          }
        }
        return prev
      })
    })

    return () => {
      unsubSessionCreated()
      unsubSessionCancelled()
      unsubFileUploaded()
    }
  }, [])

  const clearReceiveProgress = () => {
    setReceiveProgress(null)
  }

  return {
    receiveProgress,
    clearReceiveProgress
  }
}

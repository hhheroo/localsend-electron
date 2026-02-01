import { useState, useRef, useEffect } from 'react'
import { useClients, type Client } from '../hooks/useClients'
import { useDeviceInfo } from '../hooks/useDeviceInfo'
import { logger } from '../utils/logger'

// Icons
const FileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const FolderIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)

const TextIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="17" y1="10" x2="3" y2="10" />
    <line x1="21" y1="6" x2="3" y2="6" />
    <line x1="21" y1="14" x2="3" y2="14" />
    <line x1="17" y1="18" x2="3" y2="18" />
  </svg>
)

const PasteIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
)

const RefreshIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
  </svg>
)

const ScanIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

const PhoneIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
)

const DesktopIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
)

const VideoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14V7l7 5-7 5z"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)


// Selection Button Component
function SelectionButton({ 
  icon, 
  label, 
  onClick 
}: { 
  icon: React.ReactNode
  label: string
  onClick?: () => void 
}) {
  return (
    <button
      className="flex flex-col items-center justify-center w-24 h-24 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
      onClick={onClick}
    >
      <span className="text-primary mb-2">{icon}</span>
      <span className="text-sm text-primary font-medium">{label}</span>
    </button>
  )
}

// Device Card Component
function DeviceCard({ client, onClick }: { client: Client; onClick?: () => void }) {
  const getDeviceIcon = () => {
    if (client.deviceType === 'mobile') {
      return <PhoneIcon />
    }
    return <DesktopIcon />
  }

  // Get last segment of IP address
  const ipSuffix = client.address.split('.').pop() || ''

  return (
    <div 
      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
      onClick={onClick}
    >
      <div className="text-gray-400">
        {getDeviceIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-black truncate">
          {client.alias}
          <span className="text-gray-400 font-normal ml-1">#{ipSuffix}</span>
        </div>
        <div className="text-xs text-gray-500 truncate">{client.deviceModel}</div>
      </div>
    </div>
  )
}

// Loading Skeleton
function DeviceSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
      <div className="w-8 h-12 bg-gray-200 rounded animate-pulse" />
      <div className="flex-1">
        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse mb-1" />
        <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}

// Text Input Modal
function TextInputModal({
  isOpen,
  onClose,
  onSubmit
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (text: string) => void
}) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text)
      setText('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-2xl shadow-xl p-6 w-96 max-w-[90vw]">
        <h3 className="text-lg font-semibold text-black mb-4">Enter Text</h3>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message here..."
          className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-primary text-black"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

// Address Input Modal
function AddressInputModal({
  isOpen,
  onClose,
  onSubmit,
  ipPrefix
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (address: string, isHashtag: boolean) => void
  ipPrefix: string
}) {
  const [mode, setMode] = useState<'hashtag' | 'ip'>('hashtag')
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
    if (isOpen) {
      setValue('')
    }
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!value.trim()) return
    onSubmit(value.trim(), mode === 'hashtag')
    setValue('')
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      handleSubmit()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-2xl shadow-xl p-6 w-96 max-w-[90vw]">
        <h3 className="text-xl font-semibold text-black mb-4">Enter address</h3>
        
        {/* Mode Toggle */}
        <div className="flex bg-gray-100 rounded-full p-1 mb-4">
          <button
            onClick={() => { setMode('hashtag'); setValue('') }}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors border-none cursor-pointer ${
              mode === 'hashtag' 
                ? 'bg-primary text-white' 
                : 'bg-transparent text-gray-600 hover:text-black'
            }`}
          >
            Hashtag
          </button>
          <button
            onClick={() => { setMode('ip'); setValue('') }}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors border-none cursor-pointer ${
              mode === 'ip' 
                ? 'bg-primary text-white' 
                : 'bg-transparent text-gray-600 hover:text-black'
            }`}
          >
            IP Address
          </button>
        </div>

        {/* Input Field */}
        <div className="relative mb-3">
          {mode === 'hashtag' && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">#</span>
          )}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={mode === 'hashtag' ? '' : '192.168.1.100'}
            className={`w-full py-3 border border-gray-200 rounded-xl bg-primary/5 focus:outline-none focus:border-primary text-black text-lg ${
              mode === 'hashtag' ? 'pl-10 pr-4' : 'px-4'
            }`}
          />
        </div>

        {/* Helper Text */}
        <div className="text-sm text-gray-500 mb-4">
          {mode === 'hashtag' ? (
            <>
              <p>Example: 123</p>
              <p>IP Address: {ipPrefix}.{value}</p>
            </>
          ) : (
            <p>Enter the full IP address of the target device</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-light transition-colors border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

// Single file progress
interface FileProgress {
  id: string
  name: string
  size: string
  progress: number // 0-100
  status: 'pending' | 'uploading' | 'done' | 'error'
}

// Upload progress state
interface UploadProgress {
  isUploading: boolean
  files: FileProgress[]
  currentFileIndex: number
  status: 'preparing' | 'uploading' | 'done' | 'error'
  error?: string
  sessionId?: string
  fingerprint?: string
}

export function SendPage() {
  const { clients, clientCount, loading, refresh } = useClients()
  const { ips } = useDeviceInfo()
  const [showTextModal, setShowTextModal] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)

  // Get IP prefix (first 3 segments) from local IP
  const ipPrefix = ips.length > 0 ? ips[0].split('.').slice(0, 3).join('.') : '192.168.1'

  const handleSelectFile = async () => {
    if (!window.electronAPI) {
      logger.warn('electronAPI not available')
      return
    }
    const files = await window.electronAPI.selectFiles()
    if (files.length > 0) {
      setSelectedFiles(files)
      setSelectedFolder(null)
      setSelectedText(null)
      logger.log('Selected files:', files)
    }
  }

  const handleSelectFolder = async () => {
    if (!window.electronAPI) {
      logger.warn('electronAPI not available')
      return
    }
    const folder = await window.electronAPI.selectFolder()
    if (folder) {
      setSelectedFolder(folder)
      setSelectedFiles([])
      setSelectedText(null)
      logger.log('Selected folder:', folder)
    }
  }

  const handleSelectText = () => {
    setShowTextModal(true)
  }

  const handleTextSubmit = (text: string) => {
    setSelectedText(text)
    setSelectedFiles([])
    setSelectedFolder(null)
    logger.log('Text to send:', text)
  }

  const handlePaste = async () => {
    if (!window.electronAPI) {
      logger.warn('electronAPI not available')
      return
    }
    const text = await window.electronAPI.readClipboardText()
    if (text) {
      setSelectedText(text)
      setSelectedFiles([])
      setSelectedFolder(null)
      logger.log('Pasted text:', text)
    }
  }

  // Check if anything is selected
  const hasSelection = selectedFiles.length > 0 || selectedFolder !== null || selectedText !== null

  // Show toast notification
  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  // Click device to send
  const handleDeviceClick = async (client: Client) => {
    if (!window.electronAPI) {
      logger.warn('electronAPI not available')
      return
    }

    // Check if anything is selected
    if (!hasSelection) {
      showToast('Please select files, folder or text first')
      return
    }

    // Don't allow click during upload
    if (uploadProgress?.isUploading) {
      showToast('Upload in progress...')
      return
    }

    // Build file metadata list
    let filesMetadata: { path: string; text: boolean }[] = []
    let displayNames: string[] = []
    
    if (selectedFiles.length > 0) {
      filesMetadata = selectedFiles.map(path => ({ path, text: false }))
      displayNames = selectedFiles.map(path => path.split('/').pop() || path)
    } else if (selectedFolder) {
      filesMetadata = [{ path: selectedFolder, text: false }]
      displayNames = [selectedFolder.split('/').pop() || selectedFolder]
    } else if (selectedText) {
      // Text input: set text: true, path is the text content
      filesMetadata = [{ path: selectedText, text: true }]
      displayNames = ['Text message']
    }

    try {
      logger.log('Sending to', client.alias, 'files:', filesMetadata)
      
      // Initialize file progress list
      const initialFiles: FileProgress[] = filesMetadata.map((_, index) => ({
        id: `file-${index}`,
        name: displayNames[index],
        size: '',
        progress: 0,
        status: 'pending'
      }))

      // Set preparing state
      setUploadProgress({
        isUploading: true,
        files: initialFiles,
        currentFileIndex: -1,
        status: 'preparing',
        fingerprint: client.fingerprint
      })

      // 1. Send prepare-upload
      const result = await window.electronAPI.sendPrepareUpload(client.fingerprint, filesMetadata)
      logger.log('Prepare upload result:', result)

      if (!result.success) {
        throw new Error(result.error || 'Prepare upload failed')
      }

      const { sessionId, files: fileTokens } = result.filesInfo!
      const fileIds = Object.keys(fileTokens)
      
      logger.log('Session ID:', sessionId)
      logger.log('File IDs:', fileIds)

      // Update file IDs and sessionId
      const updatedFiles = initialFiles.map((f, i) => ({
        ...f,
        id: fileIds[i] || f.id
      }))
      
      // Save sessionId to state
      setUploadProgress(prev => prev ? { ...prev, sessionId } : null)

      // 2. Call sendUpload for each file
      for (let i = 0; i < fileIds.length; i++) {
        const fileId = fileIds[i]
        
        // Update current file status to uploading
        setUploadProgress(prev => {
          if (!prev) return prev
          const newFiles = [...prev.files]
          newFiles[i] = { ...newFiles[i], status: 'uploading', progress: 10 }
          return { ...prev, files: newFiles, currentFileIndex: i, status: 'uploading' }
        })

        logger.log(`Uploading file ${i + 1}/${fileIds.length}: ${fileId}`)
        
        const uploadResult = await window.electronAPI.sendUpload(client.fingerprint, sessionId, fileId)
        logger.log('Upload result:', uploadResult)

        if (!uploadResult.success) {
          // If cancelled by user, return without showing error
          if (uploadResult.cancelled) {
            logger.log('Upload cancelled by user')
            return
          }
          // Mark current file as error
          setUploadProgress(prev => {
            if (!prev) return prev
            const newFiles = [...prev.files]
            newFiles[i] = { ...newFiles[i], status: 'error', progress: 0 }
            return { ...prev, files: newFiles }
          })
          throw new Error(uploadResult.error || `Failed to upload ${updatedFiles[i].name}`)
        }

        // Mark current file as done
        setUploadProgress(prev => {
          if (!prev) return prev
          const newFiles = [...prev.files]
          newFiles[i] = { ...newFiles[i], status: 'done', progress: 100 }
          return { ...prev, files: newFiles }
        })
      }

      // Complete
      setUploadProgress(prev => prev ? { ...prev, isUploading: false, status: 'done' } : null)
      
      // Clear selected items
      setSelectedFiles([])
      setSelectedFolder(null)
      setSelectedText(null)
      
      showToast('Upload completed!')
      
      // Clear progress after 3 seconds
      setTimeout(() => setUploadProgress(null), 3000)

    } catch (error) {
      logger.error('Failed to send:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      setUploadProgress(prev => prev ? {
        ...prev,
        isUploading: false,
        status: 'error',
        error: errorMessage
      } : null)
      
      showToast('Failed: ' + errorMessage)
    }
  }

  // Cancel upload
  const handleCancelUpload = async () => {
    if (!window.electronAPI || !uploadProgress) {
      setUploadProgress(null)
      return
    }

    const { fingerprint, sessionId } = uploadProgress
    
    // If sessionId exists, call sendCancel
    if (fingerprint && sessionId) {
      try {
        await window.electronAPI.sendCancel(fingerprint, sessionId)
        logger.log('Cancel sent successfully')
      } catch (error) {
        logger.error('Failed to send cancel:', error)
      }
    }

    setUploadProgress(null)
    showToast('Upload cancelled')
  }

  // Handle address input from modal (hashtag number or full IP)
  const handleAddressSubmit = (address: string, isHashtag: boolean) => {
    // Build full IP address
    let fullIp: string
    if (isHashtag) {
      // Hashtag mode: combine with local IP prefix
      fullIp = `${ipPrefix}.${address}`
    } else {
      // IP mode: use as-is
      fullIp = address
    }

    // Create a virtual client from the address
    const virtualClient: Client = {
      alias: `Device ${isHashtag ? '#' + address : fullIp}`,
      version: '2.0',
      deviceModel: 'Unknown',
      deviceType: 'desktop',
      fingerprint: fullIp, // Use IP as fingerprint for direct connection
      port: 53317,
      protocol: 'https',
      download: false,
      address: fullIp
    }

    logger.log('Manual address input:', address, 'fullIp:', fullIp, 'isHashtag:', isHashtag)
    handleDeviceClick(virtualClient)
  }

  return (
    <main className="flex-1 bg-content-bg flex flex-col h-full p-6 overflow-y-auto relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}

      {/* Upload Progress - Full Screen */}
      {uploadProgress && (
        <div className="fixed inset-0 bg-content-bg z-50 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-black">
              {uploadProgress.status === 'preparing' && 'Preparing...'}
              {uploadProgress.status === 'uploading' && 'Sending files'}
              {uploadProgress.status === 'done' && 'Send complete'}
              {uploadProgress.status === 'error' && 'Send failed'}
            </h2>
          </div>
          
          {/* File List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {uploadProgress.status === 'preparing' ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="relative w-16 h-16">
                  {/* Outer spinning ring */}
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
                  {/* Inner pulsing dot */}
                  <div className="absolute inset-4 bg-primary rounded-full animate-pulse" />
                </div>
                <span className="text-gray-500 text-sm">Connecting to device...</span>
              </div>
            ) : uploadProgress.status === 'error' && uploadProgress.error ? (
              /* Error Display */
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 text-red-500 mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <p className="text-lg text-gray-700 text-center max-w-md">{uploadProgress.error}</p>
              </div>
            ) : (
              uploadProgress.files.map((file) => (
                <div key={file.id} className="flex items-center gap-4 p-4 bg-primary/5 rounded-xl">
                  {/* File Icon */}
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-gray-700">
                    <VideoIcon />
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-base text-black break-all">
                      {file.name}
                      {file.size && <span className="text-gray-500 ml-2">({file.size})</span>}
                    </div>
                  </div>

                  {/* Status Icon */}
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                    {file.status === 'pending' && (
                      <div className="w-4 h-4 rounded-full bg-gray-300" />
                    )}
                    {file.status === 'uploading' && (
                      <div className="relative w-6 h-6">
                        {/* Outer spinning ring */}
                        <div className="absolute inset-0 border-2 border-primary/30 rounded-full" />
                        <div className="absolute inset-0 border-2 border-transparent border-t-primary rounded-full animate-spin" />
                        {/* Inner pulsing dot */}
                        <div className="absolute inset-1.5 bg-primary rounded-full animate-pulse" />
                      </div>
                    )}
                    {file.status === 'done' && (
                      <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                    {file.status === 'error' && (
                      <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-100 border-t border-gray-200">
            {/* Buttons */}
            <div className="flex justify-end gap-4">
              {(uploadProgress.status === 'uploading' || uploadProgress.status === 'preparing') && (
                <button 
                  onClick={handleCancelUpload}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                >
                  <CloseIcon />
                  <span>Cancel</span>
                </button>
              )}
              {(uploadProgress.status === 'done' || uploadProgress.status === 'error') && (
                <button
                  onClick={() => setUploadProgress(null)}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors border-none cursor-pointer"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Text Input Modal */}
      <TextInputModal
        isOpen={showTextModal}
        onClose={() => setShowTextModal(false)}
        onSubmit={handleTextSubmit}
      />

      {/* Address Input Modal */}
      <AddressInputModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSubmit={handleAddressSubmit}
        ipPrefix={ipPrefix}
      />

      {/* Selection Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-black mb-4">Selection</h2>
        <div className="flex gap-3">
          <SelectionButton icon={<FileIcon />} label="File" onClick={handleSelectFile} />
          <SelectionButton icon={<FolderIcon />} label="Folder" onClick={handleSelectFolder} />
          <SelectionButton icon={<TextIcon />} label="Text" onClick={handleSelectText} />
          <SelectionButton icon={<PasteIcon />} label="Paste" onClick={handlePaste} />
        </div>

        {/* Selection Summary */}
        {hasSelection && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-primary/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-black">
                {selectedFiles.length > 0 && `${selectedFiles.length} file(s)`}
                {selectedFolder && 'Folder'}
                {selectedText && 'Text'}
              </span>
              <button
                onClick={() => {
                  setSelectedFiles([])
                  setSelectedFolder(null)
                  setSelectedText(null)
                }}
                className="text-gray-500 hover:text-black text-sm border-none bg-transparent cursor-pointer"
              >
                Clear
              </button>
            </div>
            
            {/* File list */}
            {selectedFiles.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-primary"><FileIcon /></span>
                    <span className="truncate">{file.split('/').pop()}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Folder */}
            {selectedFolder && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-primary"><FolderIcon /></span>
                <span className="truncate">{selectedFolder.split('/').pop()}</span>
              </div>
            )}
            
            {/* Text preview */}
            {selectedText && (
              <div className="text-sm text-gray-600 truncate">
                {selectedText.length > 100 ? selectedText.slice(0, 100) + '...' : selectedText}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Nearby Devices Section */}
      <section className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-black">Nearby devices</h2>
          <div className="flex gap-2">
            <button 
              className="p-2 text-gray-600 hover:text-black hover:bg-black/5 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
              onClick={refresh}
              title="Refresh"
            >
              <RefreshIcon />
            </button>
            <button 
              className="p-2 text-gray-600 hover:text-black hover:bg-black/5 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
              onClick={() => setShowAddressModal(true)}
              title="Enter address manually"
            >
              <ScanIcon />
            </button>
          </div>
        </div>

        {/* Device List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {loading ? (
            // Show skeleton while loading
            <DeviceSkeleton />
          ) : clientCount === 0 ? (
            // Show message when no devices found
            <div className="col-span-full text-center py-8 text-gray-500">
              No devices found
            </div>
          ) : (
            clients.map((client) => (
              <DeviceCard 
                key={client.fingerprint} 
                client={client} 
                onClick={() => handleDeviceClick(client)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-auto pt-4">
          <a href="#" className="text-primary hover:underline text-sm font-medium">
            Troubleshoot
          </a>
          <p className="text-gray-500 text-sm mt-2">
            Please ensure that the desired target is also on the same Wi-Fi network.
          </p>
        </div>
      </section>
    </main>
  )
}

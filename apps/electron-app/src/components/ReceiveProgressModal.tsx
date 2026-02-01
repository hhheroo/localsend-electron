import type { ReceiveProgress } from '../hooks/useReceiveProgress'

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

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

interface ReceiveProgressModalProps {
  progress: ReceiveProgress
  onClose: () => void
}

export function ReceiveProgressModal({ progress, onClose }: ReceiveProgressModalProps) {
  return (
    <div className="fixed inset-0 bg-content-bg z-50 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-semibold text-black">
          {progress.status === 'receiving' && 'Receiving files'}
          {progress.status === 'done' && 'Receive complete'}
          {progress.status === 'cancelled' && 'Transfer cancelled'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          From: {progress.senderName}
        </p>
      </div>
      
      {/* File List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {progress.status === 'cancelled' ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 text-orange-500 mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <p className="text-lg font-medium text-black mb-2">Transfer was cancelled</p>
            <p className="text-gray-500">The sender cancelled the transfer</p>
          </div>
        ) : (
          progress.files.map((file) => (
            <div key={file.id} className="flex items-center gap-4 p-4 bg-primary/5 rounded-xl">
              {/* File Icon */}
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <FileIcon />
              </div>
              
              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-black truncate">{file.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              </div>

              {/* Status Icon */}
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                {file.status === 'pending' && (
                  <div className="relative w-6 h-6">
                    <div className="absolute inset-0 border-2 border-primary/30 rounded-full" />
                    <div className="absolute inset-0 border-2 border-transparent border-t-primary rounded-full animate-spin" />
                    <div className="absolute inset-1.5 bg-primary rounded-full animate-pulse" />
                  </div>
                )}
                {file.status === 'receiving' && (
                  <div className="relative w-6 h-6">
                    <div className="absolute inset-0 border-2 border-primary/30 rounded-full" />
                    <div className="absolute inset-0 border-2 border-transparent border-t-primary rounded-full animate-spin" />
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
        <div className="flex justify-end gap-4">
          {(progress.status === 'done' || progress.status === 'cancelled') && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors border-none cursor-pointer"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

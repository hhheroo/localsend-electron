import { useState, useRef, useEffect } from 'react'
import { useDeviceInfo } from '../hooks/useDeviceInfo'

// Info Icon
const InfoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" stroke="white" strokeWidth="2" />
    <circle cx="12" cy="8" r="1" fill="white" />
  </svg>
)

export function HeaderIcons() {
  const { deviceName, ips, port } = useDeviceInfo()
  const [showPopup, setShowPopup] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close popup on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowPopup(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="absolute top-6 right-6">
      <div ref={containerRef} className="relative">
        <button
          className="p-2 bg-transparent border-none cursor-pointer text-black hover:bg-black/10 rounded-full transition-all"
          onClick={() => setShowPopup(!showPopup)}
        >
          <InfoIcon />
        </button>

        {showPopup && (
          <div className="absolute top-0 right-full mr-2 bg-sidebar-bg rounded-2xl shadow-lg p-5 min-w-72 z-50">
            <div className="space-y-2">
              <div className="flex">
                <span className="text-black w-28">Device name:</span>
                <span className="text-black font-medium">{deviceName}</span>
              </div>
              {ips.map((ip, index) => (
                <div className="flex" key={ip}>
                  <span className="text-black w-28">{index === 0 ? 'IP:' : ''}</span>
                  <span className="text-black font-medium font-mono">{ip}</span>
                </div>
              ))}
              <div className="flex">
                <span className="text-black w-28">Port:</span>
                <span className="text-black font-medium font-mono">{port}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

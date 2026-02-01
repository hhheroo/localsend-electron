import { useState } from 'react'
import { Sidebar, type NavItem } from './components/Sidebar'
import { ReceivePage } from './pages/ReceivePage'
import { SendPage } from './pages/SendPage'
import { useReceiveProgress } from './hooks/useReceiveProgress'
import { ReceiveProgressModal } from './components/ReceiveProgressModal'

function App() {
  const [activeTab, setActiveTab] = useState<NavItem>('receive')
  const { receiveProgress, clearReceiveProgress } = useReceiveProgress()

  const renderPage = () => {
    switch (activeTab) {
      case 'receive':
        return <ReceivePage />
      case 'send':
        return <SendPage />
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar activeItem={activeTab} onItemChange={setActiveTab} />
      {renderPage()}
      
      {/* Global receive progress modal */}
      {receiveProgress && (
        <ReceiveProgressModal 
          progress={receiveProgress} 
          onClose={clearReceiveProgress} 
        />
      )}
    </div>
  )
}

export default App

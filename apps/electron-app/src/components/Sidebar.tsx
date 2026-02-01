type NavItem = 'receive' | 'send'

interface SidebarProps {
  activeItem: NavItem
  onItemChange: (item: NavItem) => void
}

// WiFi Icon
const WifiIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <circle cx="12" cy="20" r="1" fill="currentColor" />
  </svg>
)

// Send Icon
const SendIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
  </svg>
)

export function Sidebar({ activeItem, onItemChange }: SidebarProps) {
  const navItems: { id: NavItem; label: string; icon: React.ReactNode }[] = [
    { id: 'receive', label: 'Receive', icon: <WifiIcon /> },
    { id: 'send', label: 'Send', icon: <SendIcon /> },
  ]

  return (
    <aside className="w-55 bg-sidebar-bg pt-6 flex flex-col h-full box-border">
      <h1 className="text-3xl font-bold text-black m-0 mb-8 px-6 text-center">LocalSend</h1>
      <nav className="flex flex-col">
        {navItems.map((item) => (
          <button
            key={item.id}
            className="flex items-center gap-3 px-6 py-3 cursor-pointer transition-all duration-200 w-full border-none bg-transparent hover:bg-primary-light/30"
            onClick={() => onItemChange(item.id)}
          >
            <span className={`w-18 h-9 flex items-center justify-center rounded-full ${activeItem === item.id ? 'bg-primary text-white' : 'text-black'}`}>
              {item.icon}
            </span>
            <span className="text-sm font-medium text-black">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

export type { NavItem }
